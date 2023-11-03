# Kanban Board Task Management System Backend

## About this project
Backend for kanbanfrontend. Designed with Model View Controller architecture and is serving as the controller layer. The model layer/database is MySQL.
User authentication with bycrypt and JSON webtoken.

## Setup
### Prerequisite
1. Install sql workbench community edition
2. Install node

### Steps
1. Run the 2 scripts below to create database and table
2. Add .env file with the following:
    DB_PASSWORD = xx
    SALT_ROUNDS = xxx
    JWT_SECRET = xxx
3. Key npm i in the terminal to install the node modules/dependencies
4. Key node index in the terminal to run the node server

### Create DB and Table (Useraccounts and Usergroups) SQL Script

```
CREATE DATABASE IF NOT EXISTS `kanban` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `kanban`;

CREATE TABLE IF NOT EXISTS `useraccounts` (
`username` varchar(50) NOT NULL UNIQUE,
`password` varchar(150) NOT NULL,
`email` varchar(100),
`usergroup` varchar(100),
`active` boolean NOT NULL,
PRIMARY KEY (`username`)
) ENGINE=InnoDB CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `usergroups` (
`usergroup` varchar(50) NOT NULL UNIQUE,
PRIMARY KEY (`usergroup`)
) ENGINE=InnoDB CHARSET=utf8;

INSERT INTO `useraccounts` (`username`, `password`, `email`, `usergroup`, `active`) VALUES ('tom', '$2b$10$p93y0DPA53BNSqiC7JAD8uFYI0ypnJBsq4cnRYoHLAFi.lcTr5RRO', 'test@test.com', 'admin', true);
INSERT INTO `usergroups` (`usergroup`) VALUES ('admin');
INSERT INTO `usergroups` (`usergroup`) VALUES ('project manager');
INSERT INTO `usergroups` (`usergroup`) VALUES ('project lead');
INSERT INTO `usergroups` (`usergroup`) VALUES ('developer');

```

### Create Table (Application) SQL Script

```
USE `kanban`;

CREATE TABLE IF NOT EXISTS `applications` (
  `App_Acronym` varchar(50) NOT NULL,
  `App_Description` longtext NOT NULL,
  `App_Rnumber` int NOT NULL,
  `App_startDate` date DEFAULT NULL,
  `App_endDate` date DEFAULT NULL,
  `App_permit_Open` varchar(100) DEFAULT NULL,
  `App_permit_Create` varchar(100) DEFAULT NULL,
  `App_permit_toDoList` varchar(100) DEFAULT NULL,
  `App_permit_Doing` varchar(100) DEFAULT NULL,
  `App_permit_Done` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`App_Acronym`),
  UNIQUE KEY `App_Acronym_UNIQUE` (`App_Acronym`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;


CREATE TABLE IF NOT EXISTS `plans` (
  `Plan_MVP_name` varchar(50) NOT NULL,
  `Plan_startDate` date DEFAULT NULL,
  `Plan_endDate` date DEFAULT NULL,
  `Plan_app_Acronym` varchar(50) NOT NULL,
  `Plan_color` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`Plan_MVP_name`,`Plan_app_Acronym`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;


CREATE TABLE IF NOT EXISTS `tasks` (
  `Task_name` varchar(50) NOT NULL,
  `Task_description` longtext,
  `Task_notes` longtext,
  `Task_id` varchar(50) NOT NULL,
  `Task_plan` varchar(50) DEFAULT NULL,
  `Task_app_Acronym` varchar(50) NOT NULL,
  `Task_state` varchar(50) NOT NULL,
  `Task_creator` varchar(50) NOT NULL,
  `Task_owner` varchar(50) NOT NULL,
  `Task_createDate` varchar(50) NOT NULL,
  PRIMARY KEY (`Task_id`),
  UNIQUE KEY `Task_id_UNIQUE` (`Task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
```
## API Documentation
### Users
| Endpoint | Method | Description | Parameters | Responses |
|---|---|---|---|---|
| /login | POST | Log in a user | `{ "username": "string", "password": "string" }` | 200: Successful login 403: Invalid username/password 404: Inactive user 500: Database error |
| /register | POST | Register a new user (Admin only) | `{ "username": "string", "password": "string", "email": "string", "usergroup": "string" }` | 200: User registration successful 403: Not authorized 404: Invalid input or existing username 500: Database error |
| /users | PUT | Update user details | `{ "username": "string", "password": "string", "email": "string", "usergroup": "string", "active": "boolean" }` | TBD |
| /users | POST | Get all users (Admin only) | N/A | TBD |
| /user | GET | Get own user details (My Profile) | N/A | TBD |
| /user | POST | Get user by ID (Admin only) | `{ "username": "string" }` | TBD |
| /user/auth | GET | Check valid user and isAdmin | N/A | 200: User is valid and isAdmin 403: Not authorized |
| /user/permits | POST | Check permits | `{ "App_Acronym": "string" }` | TBD |

### Usergroups
| Endpoint | Method | Description | Parameters | Responses |
|---|---|---|---|---|
| /usergroups | GET | Get all user groups (Multiselect) | N/A | 200: List of user groups 403: Not authorized 500: Database error |
| /usergroups | POST | Create a new user group (Admin only) | `{"usergroup": "string"}` | 200: User group created successfully 403: Not authorized 404: Invalid request due to missing parameters 500: Database error |                                                                                                       |

### Tasks
| Endpoint | Method | Description | Parameters | Responses |
|---|---|---|---|---|
| /tasks | GET | Get all tasks | N/A | 200: List of tasks 403: Not authorized 404: No records found 500: Database error |
| /tasks/acronym | POST | Get tasks by application acronym | `{"Task_app_Acronym": "string"}` | 200: List of tasks 403: Not authorized 404: No records found 500: Database error |
| /task | POST | Create a new task | `{"Task_name": "string", "Task_description": "string", "Add_task_notes": "string", "Task_id": "string", "Task_plan": "string", "Task_app_Acronym": "string", "Task_state": "string", "Task_creator": "string", "Task_owner": "string", "Task_createDate": "string"}` | 200: Task created successfully 403: Not authorized 404: Invalid request due to missing parameters 500: Database error |
| /task | PUT | Edit an existing task | `{"Task_name": "string", "Task_description": "string", "Task_notes": "string", "Task_id": "string", "Task_plan": "string", "Task_app_Acronym": "string", "Task_state": "string", "Task_creator": "string", "Task_owner": "string", "Task_createDate": "string"}` | 200: Task updated successfully 403: Not authorized 500: Database error |
| /task/note | POST | Add notes to a task | `{"Add_task_notes": "string", "Task_id": "string", "Task_plan": "string"}` | 200: Notes added successfully 403: Not authorized 404: Task not found 500: Database error |
| /task/id | POST | Get a task by ID | `{"Task_id": "string"}` | 200: Task details 403: Not authorized 404: Task not found 500: Database error |
| /task/promote | PUT | Promote a task to the next state | `{"Task_id": "string", "Add_Task_Notes": "string", "Task_plan": "string"}` | 200: Task promoted successfully 403: Not authorized 404: Task not found 500: Database error |
| /task/demote | PUT | Demote a task to the previous state | `{"Task_id": "string", "Add_Task_Notes": "string", "Task_plan": "string"}` | 200: Task demoted successfully 403: Not authorized 404: Task not found 500: Database error |

### Plans
| Endpoint | Method | Description | Parameters |  |
|---|---|---|---|---|
| /plan | POST | Create Plan | {"Plan_MVP_name":"string"}, {"Plan_startDate":"date"}, {"Plan_endDate":"date"}, {"Plan_app_Acronym":"string"}, {"Plan_color":"string"} | 200 (Success), 403 (Not Authorized), 404 (Invalid Request), 500 (Error) |
| /plans/acronym | POST | Get All Plans By Acronym | {"Plan_app_Acronym":"string"} | 200 (Success), 403 (Not Authorized), 404 (Invalid Request), 500 (Error) |
| /plan/acronym/name | POST | Get Plan By Acronym and Name | {"Plan_app_Acronym":"string"}, {"Plan_MVP_name":"string"} | 200 (Success), 403 (Not Authorized), 404 (Invalid Request), 500 (Error) |
| /plan/acronym/name | PUT | Edit Plan | {"Plan_app_Acronym":"string"}, {"Plan_MVP_name":"string"}, {"Plan_startDate":"date"}, {"Plan_endDate":"date"}, {"Plan_color":"string"} | 200 (Success), 403 (Not Authorized), 404 (Invalid Request), 500 (Error) |

### Apps
| Endpoint | Method | Description | Parameters | Response |
|---|---|---|---|---|
| /apps | GET | Get All Applications | N/A | 200 (Success), 403 (Not Authorized), 404 (No Record Found), 500 (Error) |
| /app/acronym | POST | Get Application By Acronym | {"App_Acronym":"string"} | 200 (Success), 403 (Not Authorized), 404 (No Record Found), 500 (Error) |
| /app | POST | Create Application | {"App_Acronym":"string"}, {"App_Description":"string"}, {"App_Rnumber":"integer"}, {"App_StartDate":"date"}, {"App_EndDate":"date"}, {"App_Permit_Create":"boolean"}, {"App_Permit_Open":"boolean"}, {"App_Permit_ToDoList":"boolean"}, {"App_Permit_Doing":"boolean"}, {"App_Permit_Done":"boolean"} | 200 (Success), 403 (Not Authorized), 404 (Invalid Request or Rnumber Validation Error), 500 (Error) |
| /app | PUT | Edit Application | {"App_Acronym":"string"}, {"App_Description":"string"}, {"App_StartDate":"date"}, {"App_EndDate":"date"}, {"App_Permit_Create":"boolean"}, {"App_Permit_Open":"boolean"}, {"App_Permit_ToDoList":"boolean"}, {"App_Permit_Doing":"boolean"}, {"App_Permit_Done":"boolean"} | 200 (Success), 403 (Not Authorized), 404 (Invalid Request), 500 (Error) |

## Summary