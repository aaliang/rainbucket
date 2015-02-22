import scala.collection.mutable
import scala.slick.driver.PostgresDriver.simple._
import scala.slick.jdbc.JdbcBackend.Database.dynamicSession
import scala.slick.jdbc.{GetResult, StaticQuery => Q}
import scala.collection.mutable._
import scala.Some


case class HashtagCount (hashtag_id: Int, count: Int, window_size: Int, timestamp: Long)

class HashtagCounts (tag: Tag) extends Table[HashtagCount](tag, "hashtag_counts") {
  def hashtag_id = column[Int]("hashtag_id")
  def count = column[Int]("count")
  def window_size = column[Int]("window_size")
  def timestamp = column[Long]("timestamp")

  def * = (hashtag_id, count, window_size, timestamp) <> (HashtagCount.tupled, HashtagCount.unapply _)
}

object HashtagCountDAO extends BaseDAO {

  private val hashTagCounts = TableQuery[HashtagCounts]

  def selectAll = db withDynSession {
    hashTagCounts.run
  }

  implicit val getHashtagCountResult = GetResult(r => HashtagCount(r.<<, r.<<, r.<<, r.<<))
  private val selectByTimeStampStartQuery = Q[(Long, Int), HashtagCount] + (
    "select * from hashtag_counts where timestamp >= ? and window_size = ? order by timestamp asc"
    )

  private val selectByTimeStampRangeQuery = Q[(Long, Long, Int), HashtagCount] + (
    "select * from hashtag_counts where timestamp between ? and ? and window_size = ? order by timestamp asc"
    )

  //consider me deprecated, in favor of the ultimate edition below. probably remove in the future
  def aggregateByTimeStampRange (start: Long, end: Option[Long], interval: Int, sample_size: Int) = db withDynSession {

    val plainQuery = end match {
      case None => (() => selectByTimeStampStartQuery(start, 20))
      case Some(_end) => (() => selectByTimeStampRangeQuery(start, _end, 20))
    }

    //this is an abomination between mutable/immutable/streams/orms
    //the reason it looks like this is because:
    // 1) we don't want to do groupbys in the database layer as it doesn't scale so we'll do it in memory
    // 2) for huge datasets, objects will be created all at once, which constrains main memory, so if we use raw sql
    //    we can iterate over each row
    // 3) using mutable collections, namely the mutable.HashMap (cringy) so that we're not rehashing for every single object.

    val start_time = System.currentTimeMillis

    plainQuery.apply.foldLeft(LinkedHashMap[Long, List[HashtagCount]]()) ((a,b) => {

      val x = a.get(b.timestamp) match {
        case Some(list:List[HashtagCount]) => {
          list ++ List(b)
        }
        case None => {
          List(b)
        }
      }

      a.put(b.timestamp, x)
      a
    })
  }

  def aggregateByTimeStampRangeUltimateEdition (
    start: Long, end: Option[Long], interval: Int, sampling_size: Int, id_map: scala.collection.immutable.Map[Int, String]) = db withDynSession {

    val WINDOW_SIZE = 20

    val plainQuery = end match {
      case None => (() => selectByTimeStampStartQuery(start, WINDOW_SIZE))
      case Some(_end) => (() => selectByTimeStampRangeQuery(start, _end, WINDOW_SIZE))
    }

    //this is an abomination between mutable/immutable/streams/orms
    //the reason it looks like this is because:
    // 1) we don't want to do groupbys in the database layer as it doesn't scale so we'll do it in memory
    // 2) for huge datasets, objects will be created all at once, which constrains main memory, so if we use raw sql
    //    we can iterate over each row
    // 3) using mutable collections, namely the mutable.HashMap (cringy) so that we're not rehashing for every single object.

    var currentPoint:Long = start

    plainQuery.apply.foldLeft(LinkedHashMap[Long, HashMap[String, Int]]()) ((
      timestampMap: LinkedHashMap[Long, HashMap[String, Int]], hashtag: HashtagCount) => {

        val hashtagText = id_map.get(hashtag.hashtag_id).get

        while (hashtag.timestamp > currentPoint) {
          currentPoint = currentPoint + interval*1000
          timestampMap.put(currentPoint, mutable.HashMap[String, Int]())
        }

        // yes this is a defaultdict
        val innerMap = timestampMap.get(currentPoint).getOrElse(mutable.HashMap[String, Int]())

        val count = innerMap.get(hashtagText).getOrElse(0)

        //mutate the branch
        innerMap.put(hashtagText, count + hashtag.count)
        timestampMap.put(currentPoint, innerMap)

        timestampMap
    })
  }

  def selectByTimeStampRangeDep (start: Long, end: Option[Long]) = db withDynSession{

    val _f = end match {
      case Some(l) => ((x:HashtagCounts) => {x.timestamp >= start && x.timestamp <= l})
      case None => ((x:HashtagCounts) => {x.timestamp >= start})
    }

    hashTagCounts.filter(_f).run

  }

  def insert (hashtag_id: Int, count: Int, window_size: Int, timestamp: Long) = db withDynSession {
    hashTagCounts.insert(HashtagCount(hashtag_id, count, window_size, timestamp))
  }

  def insertAll (args: Seq[HashtagCount]) = db withDynSession {
    hashTagCounts ++= args
  }
}