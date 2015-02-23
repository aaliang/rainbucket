import org.apache.spark.SparkContext._
import org.apache.spark.streaming.twitter._
import org.apache.spark.SparkConf
import org.apache.spark.streaming._
import org.apache.spark.streaming.StreamingContext._
import scala.io.Source._
import java.io.{FileWriter, BufferedWriter, File}
import com.typesafe.config.ConfigFactory


/**
 * Calculates popular hashtags (topics) over sliding 20 second windows from a Twitter
 * stream. The stream is instantiated with credentials and optionally filters supplied by the
 * command line arguments.
 *
 */
object PopularTags {

  val WINDOW_SIZE = 20

  def bootstrap() = {
    case class HT (id: Int, text: String, is_active: Boolean)

    val map = HashtagDAO.selectAll.groupBy(_.text).map(s => {
      val f = s._2{0}
      (s._1, HT(f.id.get, f.text, f.is_active))
    }).toMap


    val lines = fromFile("file.txt").getLines.map(_.toLowerCase).toList.filter(x => {
      map.get(x) match {
        case None => true
        case Some(_) => false
      }
    })

    HashtagDAO.insertAll(lines.map(x => {
      Hashtag(None, x, true)
    }))

    HashtagDAO.selectAll
  }

  def outtie(timestamp: Time, tl: Array[(Int, String)], hashTagsToIds: Map[String, Int]) {

    val stuff = for {(count, hashtag) <- tl} yield {
      HashtagCount(hashTagsToIds.get(hashtag).get, count, WINDOW_SIZE, timestamp.milliseconds)
    }

    HashtagCountDAO.sendx( () => {HashtagCountDAO.insertAll(stuff)})
  }

  def main(args: Array[String]) {

    val tags = bootstrap()

    val filteredHashTags = tags.map(_.text)
    val acceptedHashTags = filteredHashTags.toSet
    val hashTagsToIds = tags.map(x => (x.text, x.id.get)).toMap

    StreamingExamples.setStreamingLogLevels()

    val conf = ConfigFactory.load()

    System.setProperty("twitter4j.oauth.consumerKey", conf.getString("twitter4j.oauth.consumerKey"))
    System.setProperty("twitter4j.oauth.consumerSecret", conf.getString("twitter4j.oauth.consumerSecret"))
    System.setProperty("twitter4j.oauth.accessToken", conf.getString("twitter4j.oauth.accessToken"))
    System.setProperty("twitter4j.oauth.accessTokenSecret", conf.getString("twitter4j.oauth.accessTokenSecret"))

    val sparkConf = new SparkConf().setMaster("local[2]").setAppName("TwitterPopularTags")
    val ssc = new StreamingContext(sparkConf, Seconds(WINDOW_SIZE))
    val stream = TwitterUtils.createStream(ssc, None, filteredHashTags)

    //only flatmap the hashtags we've filtered on
    val hashTags = stream.flatMap(status => {
      status.getText
          .toLowerCase
          .replaceAll("[^a-zA-Z0-9# ]", "")
          .split(" ")
          .filter(x => x.startsWith("#") && acceptedHashTags.contains(x))
    })

    val topCounts20 = hashTags.map((_, 1))
                        .reduceByKeyAndWindow(_ + _, Seconds(WINDOW_SIZE))
      .map{case (topic, count) => (count, topic)}
      .transform(_.sortByKey(false))

    // Print popular hashtags
    topCounts20.foreachRDD((rdd, time) => {
      val topList = rdd.collect
      println("\nPopular topics in last 20 seconds (%s total):".format(rdd.count()))
      topList.foreach{case (count, tag) => println("%s (%s tweets)".format(tag, count))}

      outtie(time, topList, hashTagsToIds)
    })

    ssc.start()
    ssc.awaitTermination()
  }
}


import org.apache.spark.Logging

import org.apache.log4j.{Level, Logger}

/** Utility functions for Spark Streaming examples. */
object StreamingExamples extends Logging {

  /** Set reasonable logging levels for streaming if the user has not configured log4j. */
  def setStreamingLogLevels() {
    val log4jInitialized = Logger.getRootLogger.getAllAppenders.hasMoreElements
    if (!log4jInitialized) {
      // We first log something to initialize Spark's default logging, then we override the
      // logging level.
      logInfo("Setting log level to [WARN] for streaming example." +
        " To override add a custom log4j.properties to the classpath.")
      Logger.getRootLogger.setLevel(Level.WARN)
    }
  }
}
