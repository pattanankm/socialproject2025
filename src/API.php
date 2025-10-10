// login
<?php
include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$username = $data["username"];
$password = $data["password"];

$sql = "SELECT * FROM users WHERE username='$username' OR email='$username'";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user["password"])) {
        echo json_encode(["status" => "success", "user_id" => $user["id"]]);
    } else {
        echo json_encode(["status" => "error", "message" => "Wrong password"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "User not found"]);
}
?>

// register
<?php
include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$username = $data["username"];
$email = $data["email"];
$password = password_hash($data["password"], PASSWORD_DEFAULT);

$sql = "INSERT INTO users (username, email, password) VALUES ('$username', '$email', '$password')";
if ($conn->query($sql)) {
    echo json_encode(["status" => "success", "message" => "User registered"]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}
?>

// To retrieve all posts (Feed or Timeline)
<?php
include "db.php";

$sql = "SELECT posts.id, posts.content, posts.created_at, users.username
        FROM posts 
        JOIN users ON posts.user_id = users.id
        ORDER BY posts.created_at DESC";

$result = $conn->query($sql);

$posts = [];
while ($row = $result->fetch_assoc()) {
    $posts[] = $row;
}
echo json_encode($posts);
?>

// Create Post
<?php
include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data["user_id"];
$content = $data["content"];

$sql = "INSERT INTO posts (user_id, content) VALUES ($user_id, '$content')";
if ($conn->query($sql)) {
    echo json_encode(["status" => "success", "post_id" => $conn->insert_id]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}
?>

// Like / Unlike Post
<?php
include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data["user_id"];
$post_id = $data["post_id"];

$check = $conn->query("SELECT * FROM likes WHERE user_id=$user_id AND post_id=$post_id");

if ($check->num_rows > 0) {
    $conn->query("DELETE FROM likes WHERE user_id=$user_id AND post_id=$post_id");
    echo json_encode(["status" => "unliked"]);
} else {
    $conn->query("INSERT INTO likes (user_id, post_id) VALUES ($user_id, $post_id)");
    echo json_encode(["status" => "liked"]);
}
?>

// Add Comment
<?php
include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data["user_id"];
$post_id = $data["post_id"];
$text = $data["text"];

$sql = "INSERT INTO comments (user_id, post_id, text) VALUES ($user_id, $post_id, '$text')";
if ($conn->query($sql)) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}
?>

// Database connection medium
<?php
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "socialdb";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}
?>
