import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Dialog from 'client-v2/components/ui/dialog';
import { STARTER_TEXTS, STARTERS_TEXT } from 'client-v2/help/starters-text';
import { WELCOME_TEXT } from 'client-v2/help/welcome-text';
import { PROJECT_SCOPE } from 'client-v2/project/schema';
import { STARTERS } from 'client-v2/project/starters';
import type HelpService from 'client-v2/services/help';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';

/**
 * The welcome: what Euclip is, the starters to begin from, and the way in (the tour, or just start).
 * Shown once on a browser's first visit (see HelpService), and from Help in the project menu.
 */
export default class WelcomeDialog extends Component {
  @service declare help: HelpService;
  @service declare project: ProjectService;
  @service declare view: ViewService;

  text = WELCOME_TEXT;
  startersLabel = STARTERS_TEXT.welcomeStartersLabel;
  starters = STARTERS.map((starter) => ({
    id: starter.id,
    ...STARTER_TEXTS[starter.id],
  }));

  close = (): void => this.help.closeWelcome();

  tour = (): void => {
    const opener = this.help.opener;
    this.help.closeWelcome();
    this.help.startTour(opener);
  };

  pick = async (id: string): Promise<void> => {
    const starter = STARTERS.find((candidate) => candidate.id === id);
    if (!starter) return;
    this.help.closeWelcome();
    await this.project.newProject(starter.build());
    this.view.selectTrack(this.project.doc.tracks[0]?.id ?? PROJECT_SCOPE);
  };

  <template>
    <Dialog
      @title={{this.text.title}}
      @closeLabel={{this.text.close}}
      @onClose={{this.close}}
      @returnTo={{this.help.opener}}
      data-test-welcome
    >
      <:default>
        <p class="dialog__lead">{{this.text.about}}</p>
        <ul class="dialog__choices" aria-label={{this.startersLabel}}>
          {{#each this.starters key="id" as |starter|}}
            <li>
              <button
                type="button"
                class="dialog__choice"
                data-test-welcome-starter={{starter.id}}
                {{on "click" (fn this.pick starter.id)}}
              >
                <span class="dialog__choice-name">{{starter.name}}</span>
                <span class="dialog__choice-text">{{starter.description}}</span>
              </button>
            </li>
          {{/each}}
        </ul>
      </:default>
      <:actions>
        <button
          type="button"
          class="btn btn--solid"
          data-autofocus
          data-test-welcome-tour
          {{on "click" this.tour}}
        >{{this.text.takeTour}}</button>
        <button
          type="button"
          class="btn"
          data-test-welcome-start
          {{on "click" this.close}}
        >{{this.text.justStart}}</button>
      </:actions>
    </Dialog>
  </template>
}
