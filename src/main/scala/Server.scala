object Server {
  def main(args: Array[String]) {

    unfiltered.netty.Server.http(8080)
      .handler(HashtagCountPlan)
     .resources(getClass.getResource("public/"), 1, passOnFail = false)
      .run

    dispatch.Http.shutdown()
  }
}