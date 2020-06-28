export default function(server) {
  server.createList('user', 1);
  server.createList('project', 5, 'withTracks');
  server.loadFixtures();

    /*
    Seed your development database using your factories.
    This data will not be loaded in your tests.
  */


}
