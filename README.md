wanderio-api-tester
----------------------

A simple script to test a search from start to produced results on Wanderio API.

Invoke `forkbomb.sh` and grep the results: `cat log/*.log | grep -E 'DONE|FAIL'`

Some env variables are needed to work:
* `WCLI_TOKEN`: wanderio api token
* `WCLI_USER`: wanderio api user

Some env variables can be overrided:
* `WCLI_MAXCLIENTS` (default 8): number of clients
* `WCLI_API_ENDPOINT` (default https://www.wanderio.com): api endpoint
* `WCLI_MAXTRIES_TRIP` (default 40): maximum tries for trip phase before declaring it failed
* `WCLI_MAXTRIES_COMB` (default 40): maximum tries for combination phase before declaring it failed


-----------------------

A docker-compose file is provided that mounts the directory specified in `SOURCE_DIR` and waits. You can login inside the container and execute everything from there (if you lack a bash interpreter and/or node.js)
