import unfiltered.request._
import unfiltered.response._
import unfiltered.netty._
import scala.concurrent.{ExecutionContext,Future}

@io.netty.channel.ChannelHandler.Sharable
object HashtagCountPlan extends future.Plan with ServerErrorResponse {
  implicit def executionContext = ExecutionContext.Implicits.global

  val idToTextMap = HashtagDAO.selectAll.filter(_.is_active).map(x => (x.id.get, x.text)).toMap

  //this is very crude. please don't use this as a model if this ever hits prod
  def getStringParam (x:Any): String = x match {
    case Seq(a) => a.toString
    case _ => {
      throw new Exception("parameter not found")
    }
  }

  def getLongParam (x:Any, default: Long): Long = x match {
    case Seq(a) => a.toString.toLong
    case _ => default
  }

  def getLongParam (x:Any, default: Option[Long]): Option[Long] = x match {
    case Seq(a) => Some(a.toString.toLong)
    case _ => default
  }

  def getIntParam (x:Any, default: Int): Int = x match {
    case Seq(a) => a.toString.toInt
    case _ => default
  }

  val index = ResponseString(scala.io.Source.fromFile(getClass.getResource("public/index.html").getFile).mkString)


  def intent = {

    /**
     * Get. It's not really async.
     */
    case req @ GET(Path("/hashtag_counts") & Params(params)) => {

      //default the start time to 6 hours ago
      val defaultStart = System.currentTimeMillis - (6*60*60*1000)

      val start = getLongParam(params("start"), defaultStart)
      val end = getLongParam(params("end"), None)
      val interval = getIntParam(params("interval"), 20)
      val sampling_size = getIntParam(params("sampling_size"), 120)

      //note samping_size IS NOT MEANT TO BE REDUNANT WITH THE interval. subtle but very important difference
      val timestampAggros = HashtagCountDAO.aggregateByTimeStampRangeUltimateEdition(start, end, interval, sampling_size, idToTextMap)

      val responseAsJson = (for (anEntry <- timestampAggros) yield {
        val sb = new StringBuilder
        sb.append("{")
        sb.append("\"timestamp\":")
        sb.append(anEntry._1) //the timestamp

        for (aHashTagCount <- anEntry._2) {
          sb.append(",")
          sb.append("\"")
          sb.append(aHashTagCount._1)
          sb.append("\":")
          sb.append(aHashTagCount._2)
        }

        sb.append("}")
        sb.toString
      }).mkString(",")

      Future.successful(JsonContent ~> ResponseString("[" + responseAsJson + "]"))
    }

    case req @ GET(Path("/ok")) => {
      Future.successful(JsonContent ~> ResponseString("""{ "response": "Ok" }"""))
    }

    //im sure there's a better way to do this
    case req @ GET(Path("/")) => {
      Future.successful(ResponseString(scala.io.Source.fromFile(getClass.getResource("public/index.html").getFile).mkString))
    }

    // //this is really here for debugging. resources are placed into the target directory at compile time...
    // case req @ GET(Path(Seg("static" :: pathParts))) => {
    //   import java.io._

    //   val path = new File(".").getAbsolutePath() + "/src/main/resources/public/static/" + pathParts.mkString("/")

    //   Future.successful(ResponseString(scala.io.Source.fromFile(path).mkString))
    // }

  }

}
