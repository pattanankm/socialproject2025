<?php
//this just for test db connection, no need to appear in doc
// Health Check Endpoint: /health.php
include "db.php";
echo json_encode(["status" => "ok", "db" => $dbname]);
?>