import scala.slick.driver.PostgresDriver.simple._
import scala.slick.jdbc.JdbcBackend.Database.dynamicSession

case class Hashtag (id: Option[Int], text:String, is_active:Boolean)

class Hashtags (tag: Tag) extends Table[Hashtag](tag, "hashtags") {
  def id = column[Int]("id", O.PrimaryKey, O.AutoInc)
  def text = column[String]("text")
  def is_active = column[Boolean]("is_active")

  def * = (id.?, text, is_active) <> (Hashtag.tupled, Hashtag.unapply _)
}

object HashtagDAO extends BaseDAO {

  private val hashtags = TableQuery[Hashtags]

  def selectAll = db withDynSession {
    hashtags.run
  }

  def insert(text: String, is_active: Boolean) = db withDynSession {
    hashtags.insert(Hashtag(None, text, is_active))
  }

  def insertAll(args: Seq[Hashtag]) = db withDynSession {
    hashtags ++= args
  }
}