# Devise auth solution forked from Sandbox API

This is a Ruby 2.7.x, Rails 6.0.x API which uses PostgreSQL, Devise for Authentication, and RSpec for the test suite. Its purpose is to be a base API setup, with authentication. This code can be used `as-is` or you can modify the content for your purposes. It uses Devise AllowlistedJwt token authentication. How to create, update, deactivate, login, and logout a user is demonstrated below.

If you clone the app locally, once cloned, you will need to make sure you have Ruby 2.7.2 installed.

There were a number of issues found after creating and setting up the app. Particularly, RSpec had issues running tests if specific gems were not installed properly. Normally, you would simply install your Ruby, update the gems, then bundle install gems. However, there are a couple of steps needed to get the environement right for this particular setup.

<br>

## RBENV

This project was setup using RBENV with a number of addons. This is the command used to install RBENV.

```sh
brew install rbenv rbenv-gemset rbenv-use rbenv-aliases
```

This install will provide the ability to use gemsets with RBENV. Once installed, you can install the needed ruby by calling the following:

```sh
rbenv install 2.7.2
```

Once the install completes, run the following:

```sh
gem update —system && gem uninstall minitest && gem update && gem uninstall bigdecimal date etc fileutils json openssl ostruct psych stringio && gem cleanup && gem install bigdecimal date etc fileutils json ostruct stringio --default
```

This process will update a number of important gems but the uninstall will downgrade gems which cause RSPEC to have issues.

Once you have Ruby installed, you should be able to run `bundle install` to install the gems needed to run the application.

<br>

### Master.key and Credentials

Rails 6 incorporates saving secrets in an encrypted file named `config/credentials.yml.enc`. To view or edit the file, you need the master key which was auto-generated and saved as `config/master.key`. The master key is the key to unlock the credentials file. Without the master key the API wont be able to access the keys needed to run the app an you won't have access to update the credentials file. The `config/master.key` file is not included as part of this repo.

Run the following to create the `config/master.key` file:

```sh
echo 2105ce38a817f921aec33e4e5203ba08 > config/master.key
```

Normally, you wouldn't share this key. However, for the purposes of this example, you will need the key to run the API.

#### Editing Rails Credentials

To edit the file in VSCode, you need to [install the plugin](https://marketplace.visualstudio.com/items?itemName=betterplace.rails-edit-credentials). Once installed you can run the following at the command-line:

```sh
# Using VSCode
EDITOR="code --wait" bin/rails credentials:edit

# or if you would rather use VIM
EDITOR="vim --wait" bin/rails credentials:edit
```

#### Encrypted Secrets Resources

* [Rails environmental-security](https://edgeguides.rubyonrails.org/security.html#environmental-security)
* [Encrypted Secrets](https://medium.com/@kirill_shevch/encrypted-secrets-credentials-in-rails-6-rails-5-1-5-2-f470accd62fc)

<br>

#### Generating NEW Credentials

[Credentials for Rails 6](https://blog.saeloun.com/2019/10/10/rails-6-adds-support-for-multi-environment-credentials.html)

If you would want to generate new credentials, or if your master.key has been compromised, you should generate new credential files.

Currently, no automatic key generation feature is available, it has to be done manually.

* Copy content of original credentials `rails credentials:show` somewhere temporarily.

* Delete `config/master.key` and `config/credentials.yml.enc`

* Run `EDITOR=vim rails credentials:edit` in the terminal. This command will create a `new master.key` and credentials.yml.enc if they do not exist.

* Paste the original credentials you copied (step 1) in the new credentials file (and save + quit vim)

* Add and Commit the file `config/credentials.yml.enc`. DO NOT add and commit the `master.key`

<br>

## API Details

The API will expect all requests to made with a JSON body, and if logged in, you will need to include the Authorization header Bearer token for specific API endpoints.

<br>

## Devise

Devise is used for creating, updating, authenticating, and deactivating users. Argon2 is used with Salt and Pepper to encrypt the user's password. Users are signed in using AllowlistedJwt Devise JWT and signed out by deleting AllowlistedJwt entries. Also, Allowlisted entries have a 24 hour expire time. If the token expires or the user logs out, they will need to log in again to create a new session.

Custom Registration and Session controllers are used to mitigate using JWT. Also, I added a `Devisable` concern for sharing methods between the controllers.

The `devise_failure_service` was added to return specific JSON errors whenever Devise returns an error.

<br>

### Creating and updating users

Users can be created and updated using `form-data` or `JSON`. However, to add an avatar to a user, you must use `form-data`. The API endpoint for creating a user is `POST /registration`.

<br>

### Creating a User with Form-Data (to upload an avatar)

To POST, you can use curl or postman or any utility that allows you to send `multipart/form-data`. The following example demonstrates how to use curl:

```js
data = {
  user: {
    first_name: "james",
    last_name: "staub",
    username: "euclip",
    email: "jamesstaub@gmail.com",
    password: "3uCl1p#",
    password_confirmation: "3uCl1p#",
  },
};

fetch("https://localhost:3000/registration", {
  body: JSON.stringify(data),
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  method: "POST",
});

```

```sh
curl -v \
  -H 'Content-Type: multipart/form-data' \
  -H 'Accept: application/json'
  -X POST \
  -F user[first_name]=Baked \
  -F user[last_name]=Beans \
  -F user[username]=bakedbeans920 \
  -F user[email]=bakedbeans920@gmail.com \
  -F user[password]=$Qwerty1 \
  -F user[password_confirmation]=$Qwerty1 \
  -F user[avatar]=@~/path/to/the/avatar.png
  http://localhost:3000/registration
```

<br>

### Creating a User with JSON

You will not be able to uplad an avatar using JSON. However, you can create a user without an avatar and upload an avatar at a later time. The expected JSON payload is as follows:

```JSON
{
  "user": {
    "first_name": "Baked",
    "last_name": "Beans",
    "username": "bakedbeans913",
    "email": "bakedbeans+913@gmail.com",
    "password": "$Qwerty1",
    "password_confirmation": "$Qwerty1"
  }
}
```

All fields are required. Fill in the values with whatever you would like. There are validations on certain fields. You will be notified if any values are not acceptable. Once created the API will return the new user:

```JSON
{
  "data": {
    "id": "6142f110-c35d-4f16-8e6a-a77bd20ca33a",
    "type": "user",
    "attributes": {
      "id": "6142f110-c35d-4f16-8e6a-a77bd20ca33a",
      "first_name": "Baked",
      "last_name": "Beans",
      "username": "bakedbeans913",
      "email": "bakedbeans913@gmail.com",
      "settings": { "roles": [ "user" ] },
      "created_at": "2020-08-15T20:50:19.621Z",
      "updated_at": "2020-08-15T20:50:19.626Z"
    }
  }
}
```

### Logging in a User

The API endpoint for logging in a user is `POST /login`. The expected payload is as follows:

```JSON
{
  "user": {
    "login": "bakedbeans911",
    "password": "$Qwerty1"
  }
}
```

Once logged in the API will return the user data and the header Authorization token

```JSON
{
  "data": {
    "id": "6142f110-c35d-4f16-8e6a-a77bd20ca33a",
    "type": "user",
    "attributes": {
      "id": "6142f110-c35d-4f16-8e6a-a77bd20ca33a",
      "first_name": "Baked",
      "last_name": "Beans",
      "username": "bakedbeans913",
      "email": "bakedbeans913@gmail.com",
      "settings": {},
      "created_at": "2020-08-15T20:50:19.621Z",
      "updated_at": "2020-08-15T20:50:19.626Z"
    }
  }
}
```

Authorization header example:

```txt
Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlMmMyOWE5OS1lZWRjLTRjOGYtYjExYy05ZTNjYTEwMmNiOGYiLCJzY3AiOiJ1c2VyIiwiYXVkIjpudWxsLCJpYXQiOjE1OTc1MjAxMTcsImV4cCI6MTU5NzYwNjUxNywianRpIjoiNzJjMzZiOGYtNDRjZC00NzM5LWJmM2MtNDhmMWYwZWY5MWYxIn0.nsekyoyEGdLY62yXZgPPuEit3D9z_M89_mzZPwAO7a8
```

After the user is logged in, use the Authorization header token in each of your API calls.

<br>

### Logging out a User

The API endpoint for logging out a user is `DELETE /logout`. There is no expected payload, however, you must use the Authorization header Bearer token in the call.

<br>

### Updating a User

The API endpoint for logging in a user is `PUT /registration`. The expected payload contains user and the user's current password and the Authorization header token

```JSON
{
  "user": {
    "first_name": "Jimmy",
    "current_password": "$Qwerty1",
  }
}
```

You can also update the avatar, however, you will need to submit your update request using `form-data` instead of JSON (see the curl example above).

<br>

### Deactivating a User

The API endpoint for deactivating is a user is `DELETE /registration`. You will need to submit the user's current password with the request as well as the Authorization header token:

```JSON
{
  "user": {
    "current_password": "$Qwerty1"
  }
}
```

### Deleting an Avatar

The API endpoint for deleting a logged in user's avatar is `DELETE /registration/avatar`. You will need to submit the user's current password with the request as well as the Authorization header token:

```JSON
{
  "user": {
    "current_password": "$Qwerty1"
  }
}
```

<br>

### Viewing a User's Avatar

The API endpoint for viewing a logged in user's avatar is `GET /registration/avatar`. You will need to submit the user's current password with the request as well as the Authorization header token:

```JSON
{
  "user": {
    "current_password": "$Qwerty1"
  }
}
```

<br>

### Cleaning Up Expired JWTs

I added a rake task that will remove expired JWTs. The taks removes all expired JWTs based on the time the task is run `Time.current`. To run the the rake task:

```sh
rake clean_jwts
```

The task tuns and is timed. The total time is output after the task it complete.

<br>

### Updating a Users Password from a token

If the user has a reset_password_token, they can submit the raw payload to change the password as follows:

```JSON
{
  "user": {
    "password": "$Qwerty2",
    "reset_password_token": "ajhfdukyjerghi22dkjsh"
  }
}
```

The `reset_password_token` is the raw value generated when the tokens were created and emailed to the user. Please review `spec/requests/password_spec.rb` to review how the token is generated.

<br>

## Rspec Tests

This app uses the RSpec 4.x test suite with `database_cleaner-active_record`, `factory_bot_rails`, `faker`, `pry`, `simplecov`, `timecop`, and `webmock`. Fixtures are enabled but none have been created. This app has 99.3% code coverage.

To run the entire test suite, run the following:

```sh
rspec
```

To run specific test you will call the specific test file:

```sh
rspec spec/requests/registration_spec.rb
```

If you would like to run a single test in the test file you will call the line number of the test in the test file:

```sh
rspec spec/requests/registration_spec.rb:129
```
