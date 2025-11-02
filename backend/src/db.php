<?php

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT); // Enable error reporting

header("Content-Type: application/json; charset=utf-8");

$allowed = [
  "http://localhost:5137",
  "http://127.0.0.1:5137",

  // **need to be added here when deploy**
  "https://<frontend>.web.app",
  "https://<frontend>.firebaseapp.com"
];

// CORS Handling
$origin = $_SERVER['HTTP_ORIGIN'] ?? "";
if (in_array($origin, $allowed)) {
  header("Access-Control-Allow-Origin: $origin");
  header("Vary: Origin");
} else {
  header("Access-Control-Allow-Origin: *"); //**just for test (dev)
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// option request handling
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

//  DB CONFIG with error handling (try-catch)
$host = "localhost";
$user = "root";
$pass = "1234";
$dbname = "social_app";

try {
    $conn = new mysqli($host, $user, $pass, $dbname);
    $conn->set_charset("utf8mb4");
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed.",
        "error" => $e->getMessage() // Optional: remove in production
    ]);
    exit();
}
?>
?>
