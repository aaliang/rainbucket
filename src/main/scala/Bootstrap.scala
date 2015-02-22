import scala.io.Source._

object Bootstrap {
  def main(args: Array[String]) {

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

    System.exit(1);
  }
}