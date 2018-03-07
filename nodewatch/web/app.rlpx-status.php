<?php
require_once("./watch_app_template.php");
$app=new JsonExportApp("pubnodestatus/0.1","../db/rlpxd.db");
$app->setPermission(["127.0.0.1"]);
$app->run();
?>
