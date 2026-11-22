import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Icon from 'client-v2/components/icon';
import onOutside from 'client-v2/modifiers/on-outside';
import ownText from 'client-v2/modifiers/own-text';
import {
  EUCLIP_EXTENSION,
  ImportError,
  exportFileName,
} from 'client-v2/project/file';
import { PROJECT_SCOPE } from 'client-v2/project/schema';
import type { ProjectInfo } from 'client-v2/project/storage';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';

export interface ProjectMenuSignature {
  Element: HTMLDivElement;
  Args: {
    onUndo: () => void;
    onRedo: () => void;
  };
}

const SAVE_TEXT = {
  saved: 'Saved',
  saving: 'Saving…',
  failed: 'Not saved',
} as const;

const NAME_MAX = 80;

const when = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function changed(info: ProjectInfo): string {
  return info.updatedAt > 0 ? when.format(info.updatedAt) : '';
}

function is(a: string | undefined, b: string | undefined): boolean {
  return a === b;
}

/**
 * The project menu: the hamburger at the left end of the project bar. It holds the project's name
 * (editable in place), New project, the list of projects (open, duplicate, delete) and the project
 * file's export and import. On the phone it also holds undo and redo, which do not fit in the bar.
 */
export default class ProjectMenu extends Component<ProjectMenuSignature> {
  @service declare project: ProjectService;
  @service declare audio: AudioService;
  @service declare view: ViewService;

  @tracked open = false;
  @tracked panel: 'menu' | 'projects' = 'menu';
  @tracked list: ProjectInfo[] = [];
  /** the project whose delete is waiting for its second press */
  @tracked confirming: string | undefined;
  @tracked message: string | undefined;
  #busy = false;

  get saveText(): string {
    return SAVE_TEXT[this.project.saveState];
  }

  toggle = (): void => {
    this.open = !this.open;
    this.panel = 'menu';
    this.confirming = undefined;
    this.message = undefined;
  };

  close = (): void => {
    this.open = false;
    this.confirming = undefined;
  };

  onKey = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.open) return;
    event.stopPropagation();
    this.open = false;
    (event.currentTarget as HTMLElement)
      .querySelector<HTMLElement>('.project-menu__button')
      ?.focus();
  };

  /** One action at a time: a second press while the first is under way is ignored. */
  #run = async (action: () => Promise<void>): Promise<void> => {
    if (this.#busy) return;
    this.#busy = true;
    try {
      await action();
    } finally {
      this.#busy = false;
    }
  };

  /** A project was opened: the first track is the one selected, and the menu is done. */
  #opened(): void {
    this.view.selectTrack(this.project.doc.tracks[0]?.id ?? PROJECT_SCOPE);
    this.close();
  }

  commitName = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const name = input.value.trim().slice(0, NAME_MAX);
    this.project.apply({
      type: 'setProjectName',
      name: name === '' ? 'Untitled project' : name,
    });
    input.value = this.project.doc.name;
  };

  onNameKey = (event: KeyboardEvent): void => {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Enter') input.blur();
    if (event.key === 'Escape') {
      event.stopPropagation();
      input.value = this.project.doc.name;
      input.blur();
    }
  };

  undo = (): void => {
    this.args.onUndo();
    this.close();
  };

  redo = (): void => {
    this.args.onRedo();
    this.close();
  };

  newProject = (): Promise<void> =>
    this.#run(async () => {
      await this.project.newProject();
      this.#opened();
    });

  showProjects = (): Promise<void> =>
    this.#run(async () => {
      this.list = await this.project.projects();
      this.confirming = undefined;
      this.panel = 'projects';
    });

  showMenu = (): void => {
    this.panel = 'menu';
    this.confirming = undefined;
  };

  openProject = (id: string): Promise<void> =>
    this.#run(async () => {
      if (await this.project.openProject(id)) this.#opened();
    });

  duplicate = (id: string): Promise<void> =>
    this.#run(async () => {
      await this.project.duplicateProject(id);
      this.list = await this.project.projects();
    });

  askDelete = (id: string): void => {
    this.confirming = id;
  };

  cancelDelete = (): void => {
    this.confirming = undefined;
  };

  confirmDelete = (id: string): Promise<void> =>
    this.#run(async () => {
      const wasOpen = id === this.project.currentId;
      this.confirming = undefined;
      await this.project.deleteProject(id);
      this.list = await this.project.projects();
      if (wasOpen)
        this.view.selectTrack(this.project.doc.tracks[0]?.id ?? PROJECT_SCOPE);
    });

  exportFile = (): Promise<void> =>
    this.#run(async () => {
      const file = await this.project.exportFile();
      const blob = new Blob([JSON.stringify(file)], {
        type: 'application/json',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = exportFileName(this.project.doc.name);
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
      this.close();
    });

  chooseFile = (event: Event): void => {
    const root = (event.currentTarget as HTMLElement).closest('.project-menu');
    root?.querySelector<HTMLInputElement>('.project-menu__file')?.click();
  };

  importFile = (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return Promise.resolve();
    return this.#run(async () => {
      try {
        await this.project.importFile(await file.text());
      } catch (error) {
        this.message =
          error instanceof ImportError
            ? error.message
            : `"${file.name}" could not be read.`;
        return;
      }
      // sounds that came with the file are on the shelf now
      this.audio.shelfRevision++;
      this.#opened();
    });
  };

  <template>
    {{! template-lint-disable no-invalid-interactive }}
    <div
      class="project-menu"
      data-test-project-menu
      {{onOutside this.close}}
      {{on "keydown" this.onKey}}
      ...attributes
    >
      <button
        type="button"
        class="btn project-menu__button"
        aria-label="Project menu"
        aria-haspopup="true"
        aria-expanded={{if this.open "true" "false"}}
        data-test-project-menu-button
        {{on "click" this.toggle}}
      ><Icon @name="menu" /></button>
      <input
        type="file"
        class="project-menu__file"
        accept="{{EUCLIP_EXTENSION}},application/json"
        tabindex="-1"
        aria-label="Project file to import"
        data-test-import-file
        {{on "change" this.importFile}}
      />
      {{#if this.open}}
        <div
          class="menu project-menu__panel"
          role="group"
          aria-label="Project"
          data-test-project-panel={{this.panel}}
        >
          {{#if (is this.panel "menu")}}
            <label class="project-menu__name">
              <span class="sr-only">Project name</span>
              <input
                type="text"
                maxlength="80"
                autocomplete="off"
                data-test-project-name
                {{ownText this.project.doc.name}}
                {{on "change" this.commitName}}
                {{on "keydown" this.onNameKey}}
              />
            </label>
            {{#if this.view.phone}}
              <button
                type="button"
                class="menu__item menu__separated"
                disabled={{if this.project.canUndo false true}}
                data-test-menu-undo
                {{on "click" this.undo}}
              ><Icon @name="undo" />Undo</button>
              <button
                type="button"
                class="menu__item"
                disabled={{if this.project.canRedo false true}}
                data-test-menu-redo
                {{on "click" this.redo}}
              ><Icon @name="redo" />Redo</button>
            {{/if}}
            <button
              type="button"
              class="menu__item menu__separated"
              data-test-new-project
              {{on "click" this.newProject}}
            >New project</button>
            <button
              type="button"
              class="menu__item"
              data-test-projects
              {{on "click" this.showProjects}}
            >Projects…</button>
            <button
              type="button"
              class="menu__item menu__separated"
              data-test-export
              {{on "click" this.exportFile}}
            >Export to file</button>
            <button
              type="button"
              class="menu__item"
              data-test-import
              {{on "click" this.chooseFile}}
            >Import from file</button>
            {{#if this.message}}
              <p
                class="project-menu__message"
                role="alert"
                data-test-import-error
              >{{this.message}}</p>
            {{/if}}
            <p class="project-menu__saved menu__separated" data-test-save-state>
              <span
                class="project-menu__saved-text"
                role="status"
              >{{this.saveText}}</span>
            </p>
          {{else}}
            <button
              type="button"
              class="menu__item"
              data-test-projects-back
              {{on "click" this.showMenu}}
            >← Projects</button>
            <ul class="project-menu__list menu__separated">
              {{#each this.list key="id" as |info|}}
                <li
                  class="project-menu__row"
                  aria-current={{if (is info.id this.project.currentId) "true"}}
                  data-test-project-row={{info.name}}
                >
                  <button
                    type="button"
                    class="project-menu__open"
                    aria-label="Open {{info.name}}"
                    data-test-project-open
                    {{on "click" (fn this.openProject info.id)}}
                  >
                    <span class="truncate">{{info.name}}</span>
                    <span class="project-menu__when">{{changed info}}</span>
                  </button>
                  {{#if (is info.id this.confirming)}}
                    <button
                      type="button"
                      class="btn btn--s project-menu__cell"
                      aria-label="Confirm delete {{info.name}}"
                      data-test-project-delete-confirm
                      {{on "click" (fn this.confirmDelete info.id)}}
                    >Delete</button>
                    <button
                      type="button"
                      class="btn btn--s btn--ghost project-menu__cell"
                      data-test-project-delete-cancel
                      {{on "click" this.cancelDelete}}
                    >Cancel</button>
                  {{else}}
                    <button
                      type="button"
                      class="btn btn--s btn--ghost project-menu__cell"
                      aria-label="Duplicate {{info.name}}"
                      data-test-project-duplicate
                      {{on "click" (fn this.duplicate info.id)}}
                    >Copy</button>
                    <button
                      type="button"
                      class="btn btn--s btn--ghost project-menu__cell"
                      aria-label="Delete {{info.name}}"
                      data-test-project-delete
                      {{on "click" (fn this.askDelete info.id)}}
                    >Delete</button>
                  {{/if}}
                </li>
              {{/each}}
            </ul>
          {{/if}}
        </div>
      {{/if}}
    </div>
  </template>
}
