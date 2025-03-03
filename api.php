<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    try {
        $db = new Database();
        $conn = $db->getConnection();

        // Получение данных из POST-запроса
        $action = $_POST['action'] ?? '';

        if ($action === 'addUser') {
            // Получение данных
            $email = $_POST['email'] ?? '';
            $fullName = $_POST['fullName'] ?? '';
            $department = $_POST['department'] ?? '';
            $role = $_POST['role'] ?? '';
            $password = $_POST['password'] ?? '';
            
            // Check if email or full name already exists
            $checkStmt = $conn->prepare("SELECT email, full_name FROM users WHERE email = ? OR full_name = ?");
            $checkStmt->bind_param('ss', $email, $fullName);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            $existingUser = $result->fetch_assoc();
            
            if ($existingUser) {
                if ($existingUser['email'] === $email) {
                    echo json_encode(['success' => false, 'message' => 'A user with this email already exists']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'A user with this name already exists']);
                }
                exit;
            }

            // If no duplicates found, proceed with registration
            if ($email && $fullName && $department && $role && $password) {
                // Хэширование пароля
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);

                // Подготовка и выполнение запроса
                $stmt = $conn->prepare("INSERT INTO users (email, full_name, department, role, password) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param('sssss', $email, $fullName, $department, $role, $passwordHash);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'User registered successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error registering user']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Please fill in all required fields']);
            }

        } elseif ($action === 'getAllUsers') {
            // Получение списка пользователей
            $result = $conn->query("SELECT * FROM users");
            $users = [];
            while ($row = $result->fetch_assoc()) {
                $users[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $users]);

        } elseif ($action === 'getUserByName') {
            // Получение пользователя по имени
            $fullName = $_POST['fullName'] ?? '';
            $stmt = $conn->prepare("SELECT id, email, full_name, department, role FROM users WHERE full_name = ?");
            $stmt->bind_param('s', $fullName);
            $stmt->execute();
            $result = $stmt->get_result();
            $users = [];
            while ($row = $result->fetch_assoc()) {
                $users[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $users]);

        } elseif ($action === 'loginUser') {
            $email = $_POST['email'] ?? '';
            $password = $_POST['password'] ?? '';

            if ($email && $password) {
                $stmt = $conn->prepare("SELECT id, email, full_name, department, role, password FROM users WHERE email = ?");
                $stmt->bind_param('s', $email);
                $stmt->execute();
                $result = $stmt->get_result();
                $user = $result->fetch_assoc();

                if ($user && password_verify($password, $user['password'])) {
                    unset($user['password']);
                    echo json_encode([
                        'success' => true,
                        'user' => [
                            'id' => $user['id'],
                            'email' => $user['email'],
                            'fullName' => $user['full_name'],
                            'department' => $user['department'],
                            'role' => $user['role']
                        ]
                    ]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid input data']);
            }

        } elseif ($action === 'loginMaintenanceStaff') {
            $username = $_POST['username'] ?? '';
            $password = $_POST['password'] ?? '';

            if ($username && $password) {
                $stmt = $conn->prepare("SELECT id, username, password_hash, name, role FROM maintenance_staff WHERE username = ?");
                $stmt->bind_param('s', $username);
                $stmt->execute();
                $result = $stmt->get_result();
                $user = $result->fetch_assoc();

                if ($user && password_verify($password, $user['password_hash'])) {
                    unset($user['password_hash']);
                    echo json_encode(['success' => true, 'user' => $user]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid input data']);
            }

        } elseif ($action === 'verifyAccessCode') {
            $submittedCode = $_POST['code'] ?? '';
            
            if (empty($submittedCode)) {
                echo json_encode(['success' => false, 'message' => 'No code provided']);
                exit;
            }

            // Получаем действительный код
            $stmt = $conn->prepare("SELECT * FROM access_codes WHERE status = 'active' AND expires_at > NOW() AND code = ? LIMIT 1");
            $stmt->bind_param('s', $submittedCode);
            $stmt->execute();
            $result = $stmt->get_result();
            $validCode = $result->fetch_assoc();
            
            if (!$validCode) {
                echo json_encode(['success' => false, 'message' => 'Invalid or expired code']);
                exit;
            }

            // Помечаем код как использованный
            $usedAt = date('Y-m-d H:i:s');
            $updateStmt = $conn->prepare("UPDATE access_codes SET status = 'used', used_at = ? WHERE id = ?");
            $updateStmt->bind_param('si', $usedAt, $validCode['id']);
            $updateStmt->execute();
            
            echo json_encode(['success' => true, 'message' => 'Code verified successfully']);

        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }

    } catch (Exception $e) {
        error_log("Error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Server error occurred']);
    }
}
?> 