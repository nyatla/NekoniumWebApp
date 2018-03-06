<?php
require_once("./watch_app_template.php");
$app=new JsonExportApp("pubnodestatus/0.1","../db/pubnodelog.db");
$app->run();
?>
