name := "hivemind"

version := "1.0"

scalaVersion := "2.11.2"

retrieveManaged := true

libraryDependencies ++= Seq(
  "net.databinder" %% "unfiltered-netty-server" % "0.8.4",
  "net.databinder.dispatch" %% "dispatch-core" % "0.11.2",
  "net.databinder" %% "unfiltered-specs2" % "0.8.4" % "test",
  "com.typesafe.slick" %% "slick" % "2.1.0",
  "org.postgresql" % "postgresql" % "9.3-1100-jdbc4",
  "org.slf4j" % "slf4j-nop" % "1.6.4",
  "com.typesafe" % "config" % "1.2.1",
  "c3p0" % "c3p0" % "0.9.1.2",
  "com.typesafe.play" % "play-json_2.11" % "2.4.0-M2",
  "org.apache.spark" % "spark-core_2.11" % "1.2.0",
  "org.apache.hadoop" % "hadoop-client" % "2.2.0",
  "org.mongodb" % "mongo-java-driver" % "2.11.4",
  "org.apache.spark" % "spark-streaming_2.11" % "1.2.0",
  "org.apache.spark" % "spark-streaming-twitter_2.11" % "1.2.0",
  "org.twitter4j" % "twitter4j-core" % "3.0.3"
)

resolvers ++= Seq(
  "jboss repo" at "http://repository.jboss.org/nexus/content/groups/public-jboss/",
  "Twitter4j" at "http://twitter4j.org/maven2/",
  "Akka Repository" at "http://repo.akka.io/releases/"
)

scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature")
