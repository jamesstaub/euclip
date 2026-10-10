# For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
Rails.application.routes.draw do  
  devise_for :users,
    defaults: { format: :json },
    path: '',
    path_names: {
      registration: 'registration'
    },
    controllers: {
      sessions: 'sessions',
      registrations: 'registrations'
    },
    skip: %i[invitations confirmations password registration session]
    as :user do
      post   'login'               => 'sessions#create',              as: 'user_session'
      delete 'logout'              => 'sessions#destroy',             as: 'destroy_user_session'
      post   'registration'        => 'registrations#create',         as: 'create_user_registration'
      put    'registration'        => 'registrations#update',         as: 'update_user_registration'
      delete 'registration'        => 'registrations#destroy',        as: 'destroy_user_registration'
      delete 'registration/avatar' => 'registrations#destroy_avatar', as: 'destroy_user_avatar'
      put    'password'            => 'devise/passwords#update',      as: 'update_user_password'
    end

  namespace :v1 do
    resources :users, only: %i[index show] do
      get :avatar, on: :member
      resources :projects, param: :slug, only: %i[index show]
    end
    
    resources :preset_collections, only: %i[index], :path => '/preset-collections'
    resources :presets, only: %i[show]

    resources :projects, param: :id, only: %i[destroy]
    resources :projects, param: :slug do
      resources :tracks, only: %i[show create] do
        collection do
          post :bulk
        end
      end
    end

    resources :tracks, only: %i[update destroy]
    resources :track_controls, :path => '/track-controls'
    resources :filepath_controls, :path => '/filepath-controls'

    resources :init_scripts, :controller => 'scripts', :path => '/init-scripts'
    resources :onstep_scripts, :controller => 'scripts', :path => '/onstep-scripts'
    
    resources :sequences, only: %i[create update destroy]
    

    get '/files/search', to: 'files#search', format: :json
    get '/files/*path', to: 'files#index', format: :json
    get '/files/', to: 'files#index', format: :json

  end

  # Rails (in dev) or Nginx(in prod) will serve the index.html file by default when we hit /
  # but for all other paths, we want to serve the ember app and let the frontend router handle the rest
  # NOTE: this is a catch-all route, so it should be the last one in the file
  get '/*ember_path', to: 'ember#index', constraints: -> (req) { req.format.html? }

end
