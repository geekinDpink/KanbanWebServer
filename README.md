R2
TODO
Create and update app validation (Especially RN)
API promote task, demote task, save note
Auth to promote/demote task
Dynamic auth
Notes Generation

Done
Increase App RN when create task

---

R1
Error Handling: Missing Params - 400, Authorized users, DB Query error [test case: wrong dbconfig] - 500, JWT signTODO
TODO Add expiry and refresh token
TODO DB Query Error Handling - no record for login
TODO Update cannot find matching records
TODO CORS prevent u
TODO Edit Msg Error

Done
Got token -> Sessionislogged on
Validate inputs AND Return error code
Login API provide isAdmin
New Page API isAdmin?
password.match(rule), let rule = /^(?=._\d)(?=._[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹])(?=.\*[a-zA-Z]).{8,10}$/;
From token, decrpyt to get username and to get query for userroles
Password contains special char, upper and lower
Add Checkgroup function
Refactor admin check from substring to string
check user active middleware

Optional
catchasyncerror wrapper
Send JWT in cookies
Cookie Parser

CORS to protect what? localhost:3000 and credential
whitelist resource
Protect nodejs from unauthorised usage

JWT purpose?
Maintain authencity of session

Usergroup?

MVC model to ensure each tier perform its assigned task
Webpack bundler - bundle code and JSX transpiler

###Create DB and Table (Useraccounts and Usergroups) SQL Script

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

INSERT INTO `useraccounts` (`username`, `password`, `email`, `usergroup`, `active`) VALUES ('tom', '$2b$10$p93y0DPA53BNSqiC7JAD8uFYI0ypnJBsq4cnRYoHLAFi.lcTr5RRO', 'test@test.com', 'adminuseraccounts', true);
INSERT INTO `usergroups` (`usergroup`) VALUES ('admin');
INSERT INTO `usergroups` (`usergroup`) VALUES ('project manager');
INSERT INTO `usergroups` (`usergroup`) VALUES ('project lead');
INSERT INTO `usergroups` (`usergroup`) VALUES ('developer');

```

###Create Table (Application) SQL Script

```
USE `kanban`;

CREATE TABLE IF NOT EXISTS `applications` (
  `App_Acronym` varchar(50) NOT NULL,
  `App_Description` varchar(500) NOT NULL,
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
  `Plan_MVP_name` int NOT NULL,
  `Plan_startDate` varchar(50) DEFAULT NULL,
  `Plan_endDate` varchar(50) DEFAULT NULL,
  `Plan_app_Acronym` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Plan_MVP_name`),
  UNIQUE KEY `Plan_MVP_name_UNIQUE` (`Plan_MVP_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;


CREATE TABLE IF NOT EXISTS `tasks` (
  `Task_name` varchar(50) NOT NULL,
  `Task_description` varchar(500) DEFAULT NULL,
  `Task_notes` varchar(2500) DEFAULT NULL,
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
