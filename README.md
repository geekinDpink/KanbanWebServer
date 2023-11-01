# Kanban Board Task Management System Backend

## About this project
Backend for kanbanfrontend. Designed with Model View Controller architecture and is serving as the controller layer. The model layer/database is SQL. 

## Setup
Prerequisite:
1. Install sql workbench community edition
2. Install node

Steps:
1. Run the 2 scripts below to create database and table
2. npm i to install the node modules/dependencies
3. npm run test to run the node server

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

INSERT INTO `useraccounts` (`username`, `password`, `email`, `usergroup`, `active`) VALUES ('tom', '$2b$10$p93y0DPA53BNSqiC7JAD8uFYI0ypnJBsq4cnRYoHLAFi.lcTr5RRO', 'test@test.com', 'adminuseraccounts', true);
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
