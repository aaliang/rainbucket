import scala.concurrent.Future
import scala.slick.driver.JdbcDriver.backend.Database
import com.typesafe.config.ConfigFactory
import com.mchange.v2.c3p0.ComboPooledDataSource
import akka.actor._
import scala.concurrent.duration._
import akka.pattern.ask
import akka.util.Timeout
import scala.language.postfixOps

class BaseDAO {
  val db = BaseDAO.db

  implicit val timeout = Timeout(5 seconds) // needed for `?` below

  //dispatches work to the akka actors (ideally should be thread-pooled)
  def sendo [T : Manifest](f: () => Seq[T]): Future[Seq[T]] = {
    (BaseDAO.worker ? DWork(f)).mapTo[Seq[T]]
  }

  def sendx (f: () => Any) = {
    (BaseDAO.worker ! DWorkAny(f))
  }
}

object BaseDAO {
  private val conf = ConfigFactory.load()

  val db = {
    val ds = new ComboPooledDataSource
    ds.setDriverClass(conf.getString("db.driver"))
    ds.setJdbcUrl(conf.getString(("db.jdbc_url")))
    ds.setUser(conf.getString("db.username"))
    ds.setPassword(conf.getString("db.password"))

    Database.forDataSource(ds)
  }


  //TODO: use thread-pool-executor
  //TODO: use BalancedPool
  val system = ActorSystem()

  val worker = system.actorOf(Props[Worker], name = "worker")

}

sealed trait DMessage
case class DWork (method: () => Seq[Any]) extends DMessage
case class DWorkAny (method: () => Any) extends DMessage

sealed class Worker extends Actor {
  def receive = {
    case DWork(method) => {
      sender ! method.apply
    }

    case DWorkAny(method) => {
      method.apply
    }

  }
}