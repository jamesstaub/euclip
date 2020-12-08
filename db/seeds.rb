# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

admin = User.create!({
  first_name: "james",
  last_name: "staub",
  username: "euclip",
  email: "jamesstaub@gmail.com",
  password: "3uCl1p#",
  password_confirmation: "3uCl1p#",
})

Project.create!({
  title: "Euclip Intro",
  slug: 'euclip-intro',
  creator: admin,
})