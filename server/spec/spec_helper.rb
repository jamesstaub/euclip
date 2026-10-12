require 'simplecov'
require 'webmock/rspec'
require 'database_cleaner/active_record'

# start the things
SimpleCov.start

RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
    mocks.verify_doubled_constant_names = true
  end

  # This option will default to `:apply_to_host_groups` in RSpec 4 (and will
  # have no way to turn it off -- the option exists only for backwards
  # compatibility in RSpec 3). It causes shared context metadata to be
  # inherited by the metadata hash of host groups and examples, rather than
  # triggering implicit auto-inclusion in groups with matching metadata.
  config.shared_context_metadata_behavior = :apply_to_host_groups

  config.before(:suite) do
    # Last line of defence: the next line empties every table, so refuse to run unless the
    # connection really is a test database (whatever RAILS_ENV / POSTGRES_* say).
    database = ActiveRecord::Base.connection.current_database
    unless Rails.env.test? && database.end_with?('_test')
      abort "Refusing to run specs: connected to '#{database}' (env: #{Rails.env}). " \
            'They truncate all tables; use a database whose name ends in _test (POSTGRES_TEST_DB).'
    end

    DatabaseCleaner.clean_with(:truncation)
  end

  config.before(:each) do
    DatabaseCleaner.strategy = :transaction
    DatabaseCleaner.start
  end

  config.after(:each) do
    DatabaseCleaner.clean
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups
  config.expose_dsl_globally = true

  if config.files_to_run.one?
    config.default_formatter = "doc"
  end

  config.profile_examples = 10
  config.order = :random

  Kernel.srand config.seed
end
