# The project-wide script where macros are registered and their controls described.
#
# It runs before any track's scripts every time the project's audio is built, so the macros it registers
# are there for every track to use, and one definition serves the whole project (instead of being pasted
# into each track's setup script). It creates no audio nodes itself.
class MacrosScript < Script
  DEFAULT_CODE = <<~JS.freeze
    /**
      MACROS: runs before every track's setup script. Describe the macros (instruments made of several
      audio nodes) this project uses here, once; tracks then just use them by name.

      this.declareControls('polysynth', {
        lp_frequency: { label: 'cutoff', min: 200, max: 8000, scale: 'log' },
      });

      Open the Macros menu to load a documented example.
    **/
  JS

  def set_default
    self.type = 'MacrosScript'
    self.safe_code = DEFAULT_CODE if safe_code.nil?
    super
  end
end
