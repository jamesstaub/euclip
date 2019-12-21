export default function(server) {
  server.createList('user', 1);
  server.createList('project', 5, 'withTracks');
  /*
    Seed your development database using your factories.
    This data will not be loaded in your tests.
  */

  // server.createList('post', 10);
}
