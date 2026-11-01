<?php
// backend/config/database.php

// Headers CORS globaux pour autoriser les requêtes depuis React (localhost:5173)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class Database {
    private $host = "127.0.0.1";
    private $port = "3306";
    private $db_name = "medcine_solution_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        $portsToTry = array_unique([getenv('DB_PORT') ?: "3306", "3306", "3307"]);
        $lastException = null;

        foreach ($portsToTry as $port) {
            try {
                $dsn = "mysql:host=" . $this->host . ";port=" . $port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                $this->conn = new PDO($dsn, $this->username, $this->password, $options);
                $this->port = $port;
                return $this->conn;
            } catch (PDOException $e) {
                $lastException = $e;
            }
        }

        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Erreur de connexion MySQL : " . ($lastException ? $lastException->getMessage() : "Impossible de se connecter")
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// Helper pour envoyer une réponse JSON propre
function sendResponse($status, $data = null, $message = "", $code = 200) {
    http_response_code($code);
    echo json_encode([
        "status" => $status,
        "message" => $message,
        "data" => $data
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Helper pour lire le corps JSON d'une requête POST/PUT
function getRequestBody() {
    $raw = file_get_contents("php://input");
    if (!empty($raw)) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) return $decoded;
        parse_str($raw, $parsed);
        if (is_array($parsed) && !empty($parsed)) return $parsed;
    }
    if (!empty($_POST)) return $_POST;
    return [];
}
