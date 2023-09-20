Error Handling: Missing Params - 400, Authorized users, DB Query error [test case: wrong dbconfig] - 500, JWT sign

TODO
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
Protect nodejs from unauthorised usage

JWT purpose?
Maintain authencity of session

Usergroup?

MVC model to ensure each tier perform its assigned task
Webpack bundler - bundle code and JSX transpiler

###Create DB and Table SQL Script

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
