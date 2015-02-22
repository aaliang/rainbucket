# Rainbucket
Twitter trending hashtags tool

This counts trending hashtags pulled from the public Twitter API over a configurable interval.
Hashtag counts are stored in PostgreSQL, although the collector code can also be modified to output
to CSV relatively easy.

Also included is an API server that will fetch the counts over intervals. E.g: 'get me the counts of
all the hashtags i've been collecting between last friday at 5pm and today, broken down over 40 second
intervals' and so on.

Additionally there's a html app that will graph the results to easily visualize any trends.

![Alt text](https://github.com/aaliang/rainbucket/blob/master/screenshot.png "screenshot")

Requirements:
-------------
sbt

installation
-------------
1) clone this repo:
$ git clone https://github.com/aaliang/rainbucket.git

2) setup your postgres data
  a) probably want to create a new database e.g. 'rainbucket'
  b) run the sql commands in sql/bootstrap.sql

3) edit /src/main/resources/application.conf
  you will need to:
  a) provide your postgresql db info (a)
  b) provide twitter api auth info

3) add hashtags to monitor on, you can edit the list in file.txt (those are just example hashtags)


running the collector
---------------------
   from the /rainbucket directory you can just do:
   $ sbt "run-main PopularTags"

   yeah, i gotta rename it. The default configuration collects data in an interval of 20 seconds, counting over a 20 second window.
   If you want to change either of these values, you have to do it in source for now.

   the collector runs indefinitely. currently there is no way to add new tags to watch during runtime

viewing the results
-------------------
I sort of botched the bowerfile (or lack thereof, so I was forced to compress the bower_modules directory to zip). You can find all static files in src/main/resources/public

1) you should decompress the bower_modules.zip file to a bower_modules directory in src/main/resources/public
2) run the API server: sbt "run-main Server"
3) the app UI is hosted on the API server at the root directory on default port 8080 e.g. it should be accessible via localhost:8080
  by default it has a interval of 60 seconds and will get everything between now and 6 hours ago
 
License
-------
The MIT License (MIT)

Copyright (c) 2015 Andy Liang
