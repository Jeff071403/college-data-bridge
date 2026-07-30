SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

DROP TABLE IF EXISTS `django_migrations`;
CREATE TABLE `django_migrations` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `django_migrations` WRITE;
INSERT INTO `django_migrations` (`id`, `app`, `name`, `applied`) VALUES
(1, 'permissions', '0001_initial', '2026-07-24 12:51:16.334896'),
(2, 'roles', '0001_initial', '2026-07-24 12:51:16.348408'),
(3, 'contenttypes', '0001_initial', '2026-07-24 12:51:16.356030'),
(4, 'contenttypes', '0002_remove_content_type_name', '2026-07-24 12:51:16.367361'),
(5, 'auth', '0001_initial', '2026-07-24 12:51:16.386032'),
(6, 'auth', '0002_alter_permission_name_max_length', '2026-07-24 12:51:16.396265'),
(7, 'auth', '0003_alter_user_email_max_length', '2026-07-24 12:51:16.405603'),
(8, 'auth', '0004_alter_user_username_opts', '2026-07-24 12:51:16.413720'),
(9, 'auth', '0005_alter_user_last_login_null', '2026-07-24 12:51:16.421713'),
(10, 'auth', '0006_require_contenttypes_0002', '2026-07-24 12:51:16.429911'),
(11, 'auth', '0007_alter_validators_add_error_messages', '2026-07-24 12:51:16.442507'),
(12, 'auth', '0008_alter_user_username_max_length', '2026-07-24 12:51:16.452798'),
(13, 'auth', '0009_alter_user_last_name_max_length', '2026-07-24 12:51:16.462860'),
(14, 'auth', '0010_alter_group_name_max_length', '2026-07-24 12:51:16.473701'),
(15, 'auth', '0011_update_proxy_permissions', '2026-07-24 12:51:16.483122'),
(16, 'auth', '0012_alter_user_first_name_max_length', '2026-07-24 12:51:16.490608'),
(17, 'users', '0001_initial', '2026-07-24 12:51:16.510401'),
(18, 'activity_logs', '0001_initial', '2026-07-24 12:51:16.517781'),
(19, 'activity_logs', '0002_initial', '2026-07-24 12:51:16.534094'),
(20, 'admin', '0001_initial', '2026-07-24 12:51:16.548559'),
(21, 'admin', '0002_logentry_remove_auto_add', '2026-07-24 12:51:16.563922'),
(22, 'admin', '0003_logentry_add_action_flag_choices', '2026-07-24 12:51:16.573829'),
(23, 'folders', '0001_initial', '2026-07-24 12:51:16.583069'),
(24, 'files', '0001_initial', '2026-07-24 12:51:16.593058'),
(25, 'files', '0002_initial', '2026-07-24 12:51:16.603579'),
(26, 'files', '0003_initial', '2026-07-24 12:51:16.641551'),
(27, 'folders', '0002_initial', '2026-07-24 12:51:16.685631'),
(28, 'mous', '0001_initial', '2026-07-24 12:51:16.750136'),
(29, 'notifications', '0001_initial', '2026-07-24 12:51:16.770225'),
(30, 'notifications', '0002_initial', '2026-07-24 12:51:16.792336'),
(31, 'notifications', '0003_notification_metadata', '2026-07-24 12:51:16.811323'),
(32, 'sessions', '0001_initial', '2026-07-24 12:51:16.821465');
UNLOCK TABLES;

DROP TABLE IF EXISTS `permissions_permission`;
CREATE TABLE `permissions_permission` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `name` varchar(150) NOT NULL,
  `codename` varchar(100) NOT NULL,
  `description` longtext NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_permissions_permission_1` (`codename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `permissions_permission` WRITE;
INSERT INTO `permissions_permission` (`id`, `name`, `codename`, `description`) VALUES
(1, 'View Folder', 'view_folder', 'Can view folders in explorer'),
(2, 'Create Folder', 'create_folder', 'Can create folders in explorer'),
(3, 'Rename Folder', 'rename_folder', 'Can rename folders'),
(4, 'Delete Folder', 'delete_folder', 'Can delete folders'),
(5, 'Create Nested Folder', 'create_nested_folder', 'Can create subfolders inside folders'),
(6, 'Upload Files', 'upload_files', 'Can upload files'),
(7, 'Download Files', 'download_files', 'Can download files'),
(8, 'Delete Files', 'delete_files', 'Can delete files'),
(9, 'Replace Files', 'replace_files', 'Can replace files (create new versions)'),
(10, 'Preview Files', 'preview_files', 'Can preview files inline'),
(11, 'View Notifications', 'view_notifications', 'Can view system notifications'),
(12, 'View Dashboard', 'view_dashboard', 'Can view system dashboard stats'),
(13, 'Manage Users', 'manage_users', 'Can view users lists and details'),
(14, 'Create Users', 'create_users', 'Can create new users'),
(15, 'Edit Users', 'edit_users', 'Can update user details, roles, permissions'),
(16, 'Delete Users', 'delete_users', 'Can delete users');
UNLOCK TABLES;

DROP TABLE IF EXISTS `roles_role`;
CREATE TABLE `roles_role` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` longtext NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_roles_role_1` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `roles_role` WRITE;
INSERT INTO `roles_role` (`id`, `name`, `description`) VALUES
(1, 'Super Admin', 'Super Administrator with full system control'),
(2, 'Admin', 'Administrator who can manage files, folders, and users'),
(3, 'User', 'Standard user who can read, preview, upload, and download files in assigned folders');
UNLOCK TABLES;

DROP TABLE IF EXISTS `roles_rolepermission`;
CREATE TABLE `roles_rolepermission` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `permission_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_rolepermission_role_id_permission_id_63d30676_uniq` (`role_id`, `permission_id`),
  CONSTRAINT `fk_roles_rolepermission_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles_role` (`id`),
  CONSTRAINT `fk_roles_rolepermission_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions_permission` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `roles_rolepermission` WRITE;
INSERT INTO `roles_rolepermission` (`id`, `permission_id`, `role_id`) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1),
(4, 4, 1),
(5, 5, 1),
(6, 6, 1),
(7, 7, 1),
(8, 8, 1),
(9, 9, 1),
(10, 10, 1),
(11, 11, 1),
(12, 12, 1),
(13, 13, 1),
(14, 14, 1),
(15, 15, 1),
(16, 16, 1),
(17, 1, 2),
(18, 2, 2),
(19, 3, 2),
(20, 4, 2),
(21, 5, 2),
(22, 6, 2),
(23, 7, 2),
(24, 8, 2),
(25, 9, 2),
(26, 10, 2),
(27, 11, 2),
(28, 12, 2),
(29, 13, 2),
(30, 14, 2),
(31, 15, 2),
(32, 16, 2),
(33, 1, 3),
(34, 6, 3),
(35, 7, 3),
(36, 10, 3),
(37, 11, 3),
(38, 12, 3);
UNLOCK TABLES;

DROP TABLE IF EXISTS `django_content_type`;
CREATE TABLE `django_content_type` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `django_content_type` WRITE;
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES
(1, 'admin', 'logentry'),
(2, 'auth', 'permission'),
(3, 'auth', 'group'),
(4, 'contenttypes', 'contenttype'),
(5, 'sessions', 'session'),
(6, 'roles', 'role'),
(7, 'roles', 'rolepermission'),
(8, 'permissions', 'permission'),
(9, 'users', 'customuser'),
(10, 'users', 'userpermission'),
(11, 'folders', 'folder'),
(12, 'folders', 'folderpermission'),
(13, 'files', 'file'),
(14, 'files', 'fileversion'),
(15, 'notifications', 'notification'),
(16, 'activity_logs', 'activitylog'),
(17, 'mous', 'mou'),
(18, 'mous', 'moudocument'),
(19, 'mous', 'mourenewal'),
(20, 'mous', 'moutemplate');
UNLOCK TABLES;

DROP TABLE IF EXISTS `auth_group_permissions`;
CREATE TABLE `auth_group_permissions` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `group_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`, `permission_id`),
  CONSTRAINT `fk_auth_group_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `fk_auth_group_permissions_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `auth_permission`;
CREATE TABLE `auth_permission` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `content_type_id` bigint NOT NULL,
  `codename` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`, `codename`),
  CONSTRAINT `fk_auth_permission_content_type_id` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `auth_permission` WRITE;
INSERT INTO `auth_permission` (`id`, `content_type_id`, `codename`, `name`) VALUES
(1, 1, 'add_logentry', 'Can add log entry'),
(2, 1, 'change_logentry', 'Can change log entry'),
(3, 1, 'delete_logentry', 'Can delete log entry'),
(4, 1, 'view_logentry', 'Can view log entry'),
(5, 2, 'add_permission', 'Can add permission'),
(6, 2, 'change_permission', 'Can change permission'),
(7, 2, 'delete_permission', 'Can delete permission'),
(8, 2, 'view_permission', 'Can view permission'),
(9, 3, 'add_group', 'Can add group'),
(10, 3, 'change_group', 'Can change group'),
(11, 3, 'delete_group', 'Can delete group'),
(12, 3, 'view_group', 'Can view group'),
(13, 4, 'add_contenttype', 'Can add content type'),
(14, 4, 'change_contenttype', 'Can change content type'),
(15, 4, 'delete_contenttype', 'Can delete content type'),
(16, 4, 'view_contenttype', 'Can view content type'),
(17, 5, 'add_session', 'Can add session'),
(18, 5, 'change_session', 'Can change session'),
(19, 5, 'delete_session', 'Can delete session'),
(20, 5, 'view_session', 'Can view session'),
(21, 6, 'add_role', 'Can add role'),
(22, 6, 'change_role', 'Can change role'),
(23, 6, 'delete_role', 'Can delete role'),
(24, 6, 'view_role', 'Can view role'),
(25, 7, 'add_rolepermission', 'Can add role permission'),
(26, 7, 'change_rolepermission', 'Can change role permission'),
(27, 7, 'delete_rolepermission', 'Can delete role permission'),
(28, 7, 'view_rolepermission', 'Can view role permission'),
(29, 8, 'add_permission', 'Can add permission'),
(30, 8, 'change_permission', 'Can change permission'),
(31, 8, 'delete_permission', 'Can delete permission'),
(32, 8, 'view_permission', 'Can view permission'),
(33, 9, 'add_customuser', 'Can add custom user'),
(34, 9, 'change_customuser', 'Can change custom user'),
(35, 9, 'delete_customuser', 'Can delete custom user'),
(36, 9, 'view_customuser', 'Can view custom user'),
(37, 10, 'add_userpermission', 'Can add user permission'),
(38, 10, 'change_userpermission', 'Can change user permission'),
(39, 10, 'delete_userpermission', 'Can delete user permission'),
(40, 10, 'view_userpermission', 'Can view user permission'),
(41, 11, 'add_folder', 'Can add folder'),
(42, 11, 'change_folder', 'Can change folder'),
(43, 11, 'delete_folder', 'Can delete folder'),
(44, 11, 'view_folder', 'Can view folder'),
(45, 12, 'add_folderpermission', 'Can add folder permission'),
(46, 12, 'change_folderpermission', 'Can change folder permission'),
(47, 12, 'delete_folderpermission', 'Can delete folder permission'),
(48, 12, 'view_folderpermission', 'Can view folder permission'),
(49, 13, 'add_file', 'Can add file'),
(50, 13, 'change_file', 'Can change file'),
(51, 13, 'delete_file', 'Can delete file'),
(52, 13, 'view_file', 'Can view file'),
(53, 14, 'add_fileversion', 'Can add file version'),
(54, 14, 'change_fileversion', 'Can change file version'),
(55, 14, 'delete_fileversion', 'Can delete file version'),
(56, 14, 'view_fileversion', 'Can view file version'),
(57, 15, 'add_notification', 'Can add notification'),
(58, 15, 'change_notification', 'Can change notification'),
(59, 15, 'delete_notification', 'Can delete notification'),
(60, 15, 'view_notification', 'Can view notification'),
(61, 16, 'add_activitylog', 'Can add activity log'),
(62, 16, 'change_activitylog', 'Can change activity log'),
(63, 16, 'delete_activitylog', 'Can delete activity log'),
(64, 16, 'view_activitylog', 'Can view activity log'),
(65, 17, 'add_mou', 'Can add mou'),
(66, 17, 'change_mou', 'Can change mou'),
(67, 17, 'delete_mou', 'Can delete mou'),
(68, 17, 'view_mou', 'Can view mou'),
(69, 18, 'add_moudocument', 'Can add mou document'),
(70, 18, 'change_moudocument', 'Can change mou document'),
(71, 18, 'delete_moudocument', 'Can delete mou document'),
(72, 18, 'view_moudocument', 'Can view mou document'),
(73, 19, 'add_mourenewal', 'Can add mou renewal'),
(74, 19, 'change_mourenewal', 'Can change mou renewal'),
(75, 19, 'delete_mourenewal', 'Can delete mou renewal'),
(76, 19, 'view_mourenewal', 'Can view mou renewal'),
(77, 20, 'add_moutemplate', 'Can add mou template'),
(78, 20, 'change_moutemplate', 'Can change mou template'),
(79, 20, 'delete_moutemplate', 'Can delete mou template'),
(80, 20, 'view_moutemplate', 'Can view mou template');
UNLOCK TABLES;

DROP TABLE IF EXISTS `auth_group`;
CREATE TABLE `auth_group` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_auth_group_1` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users_customuser`;
CREATE TABLE `users_customuser` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `email` varchar(254) NOT NULL,
  `name` varchar(150) NOT NULL,
  `phone` varchar(20) NULL,
  `designation` varchar(100) NULL,
  `department` varchar(100) NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `role_id` bigint NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_users_customuser_1` (`email`),
  CONSTRAINT `fk_users_customuser_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles_role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `users_customuser` WRITE;
INSERT INTO `users_customuser` (`id`, `password`, `last_login`, `is_superuser`, `email`, `name`, `phone`, `designation`, `department`, `status`, `created_at`, `updated_at`, `is_staff`, `is_active`, `role_id`) VALUES
(1, 'pbkdf2_sha256$1000000$Y63ECY35MbMYO2ipHFnqLZ$G454DsEld3Wcsz9pAviJnfTJkb1/Yl3pvhciPhhWBjQ=', NULL, 1, 'superadmin@college.edu', 'Super Admin', NULL, 'Super Admin', 'MOU Dept', 'Active', '2026-07-24 12:51:37.941827', '2026-07-24 12:51:37.941856', 1, 1, 1),
(2, 'pbkdf2_sha256$1000000$4iFzOUz8DzMQg9heh3dZXN$W20dhHbJZ/rmLIz02x4gBaIQlzTw34AHLI44Swa+ln8=', NULL, 0, 'admin@college.edu', 'System Admin', NULL, 'MOU Administrator', 'MOU Dept', 'Active', '2026-07-24 12:51:38.320445', '2026-07-24 12:51:38.320461', 1, 1, 2),
(3, 'pbkdf2_sha256$1000000$0GMnrP4qaotc6Ra9GTTYg1$vjWO9kup4a5mAe8sdb+2EQ0oU3vc6+PYmZmGJo8oh48=', NULL, 0, 'user@college.edu', 'John Doe', NULL, 'MOU Analyst', 'MOU Dept', 'Active', '2026-07-24 12:51:38.690355', '2026-07-24 12:51:38.690371', 0, 1, 3);
UNLOCK TABLES;

DROP TABLE IF EXISTS `users_customuser_groups`;
CREATE TABLE `users_customuser_groups` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `customuser_id` bigint NOT NULL,
  `group_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_customuser_groups_customuser_id_group_id_76b619e3_uniq` (`customuser_id`, `group_id`),
  CONSTRAINT `fk_users_customuser_groups_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `fk_users_customuser_groups_customuser_id` FOREIGN KEY (`customuser_id`) REFERENCES `users_customuser` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users_customuser_user_permissions`;
CREATE TABLE `users_customuser_user_permissions` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `customuser_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_customuser_user_permissions_customuser_id_permission_id_7a7debf6_uniq` (`customuser_id`, `permission_id`),
  CONSTRAINT `fk_users_customuser_user_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `fk_users_customuser_user_permissions_customuser_id` FOREIGN KEY (`customuser_id`) REFERENCES `users_customuser` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users_userpermission`;
CREATE TABLE `users_userpermission` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `is_granted` tinyint(1) NOT NULL,
  `permission_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_userpermission_user_id_permission_id_cfb58597_uniq` (`user_id`, `permission_id`),
  CONSTRAINT `fk_users_userpermission_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_customuser` (`id`),
  CONSTRAINT `fk_users_userpermission_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions_permission` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `activity_logs_activitylog`;
CREATE TABLE `activity_logs_activitylog` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `action` longtext NOT NULL,
  `module` varchar(100) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `ip_address` char(39) NULL,
  `user_id` bigint NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_activity_logs_activitylog_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_customuser` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `activity_logs_activitylog` WRITE;
INSERT INTO `activity_logs_activitylog` (`id`, `action`, `module`, `created_at`, `ip_address`, `user_id`) VALUES
(1, 'User logged in successfully', 'authentication', '2026-07-24 12:59:14.107083', NULL, 2),
(2, 'User logged in successfully', 'authentication', '2026-07-24 14:21:53.181906', NULL, 3),
(3, 'User logged in successfully', 'authentication', '2026-07-24 14:41:05.520585', NULL, 2),
(4, 'User logged in successfully', 'authentication', '2026-07-24 14:45:05.789775', NULL, 2);
UNLOCK TABLES;

DROP TABLE IF EXISTS `django_admin_log`;
CREATE TABLE `django_admin_log` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `object_id` longtext NULL,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` bigint NULL,
  `user_id` bigint NOT NULL,
  `action_time` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_django_admin_log_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_customuser` (`id`),
  CONSTRAINT `fk_django_admin_log_content_type_id` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `folders_folder`;
CREATE TABLE `folders_folder` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by_id` bigint NULL,
  `parent_id` bigint NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_folders_folder_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `folders_folder` (`id`),
  CONSTRAINT `fk_folders_folder_created_by_id` FOREIGN KEY (`created_by_id`) REFERENCES `users_customuser` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `files_file`;
CREATE TABLE `files_file` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `size` bigint NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `file_field` varchar(100) NOT NULL,
  `version_number` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `folder_id` bigint NOT NULL,
  `uploaded_by_id` bigint NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_files_file_uploaded_by_id` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users_customuser` (`id`),
  CONSTRAINT `fk_files_file_folder_id` FOREIGN KEY (`folder_id`) REFERENCES `folders_folder` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `files_fileversion`;
CREATE TABLE `files_fileversion` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `version_number` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `size` bigint NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `file_field` varchar(100) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `file_id` bigint NOT NULL,
  `uploaded_by_id` bigint NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_files_fileversion_uploaded_by_id` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users_customuser` (`id`),
  CONSTRAINT `fk_files_fileversion_file_id` FOREIGN KEY (`file_id`) REFERENCES `files_file` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `folders_folderpermission`;
CREATE TABLE `folders_folderpermission` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `is_granted` tinyint(1) NOT NULL,
  `folder_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `folders_folderpermission_user_id_folder_id_e3f18c80_uniq` (`user_id`, `folder_id`),
  CONSTRAINT `fk_folders_folderpermission_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_customuser` (`id`),
  CONSTRAINT `fk_folders_folderpermission_folder_id` FOREIGN KEY (`folder_id`) REFERENCES `folders_folder` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mous_mou`;
CREATE TABLE `mous_mou` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `title` varchar(255) NOT NULL,
  `mou_number` varchar(100) NOT NULL,
  `partner_organization` varchar(255) NOT NULL,
  `department_name` varchar(255) NULL,
  `effective_date` date NULL,
  `signed_date` date NULL,
  `expiry_date` date NULL,
  `duration_months` int NOT NULL,
  `status` varchar(50) NOT NULL,
  `summary` longtext NULL,
  `purpose` longtext NULL,
  `objectives` longtext NULL,
  `beneficiaries` longtext NULL,
  `opportunities` longtext NULL,
  `custom_fields_data` longtext NULL,
  `coordinator_name` varchar(255) NULL,
  `coordinator_designation` varchar(255) NULL,
  `coordinator_email` varchar(254) NULL,
  `coordinator_phone` varchar(50) NULL,
  `partner_name` varchar(255) NULL,
  `partner_designation` varchar(255) NULL,
  `partner_email` varchar(254) NULL,
  `partner_phone` varchar(50) NULL,
  `additional_notes` longtext NULL,
  `remarks` longtext NULL,
  `version_number` int NOT NULL,
  `is_renewed` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by_id` bigint NULL,
  `department_id` bigint NULL,
  `original_mou_id` bigint NULL,
  `renewed_from_id` bigint NULL,
  `signed_mou_id` bigint NULL,
  `mou_type_id` bigint NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_mous_mou_1` (`mou_number`),
  CONSTRAINT `fk_mous_mou_mou_type_id` FOREIGN KEY (`mou_type_id`) REFERENCES `mous_moutemplate` (`id`),
  CONSTRAINT `fk_mous_mou_signed_mou_id` FOREIGN KEY (`signed_mou_id`) REFERENCES `files_file` (`id`),
  CONSTRAINT `fk_mous_mou_renewed_from_id` FOREIGN KEY (`renewed_from_id`) REFERENCES `mous_mou` (`id`),
  CONSTRAINT `fk_mous_mou_original_mou_id` FOREIGN KEY (`original_mou_id`) REFERENCES `files_file` (`id`),
  CONSTRAINT `fk_mous_mou_department_id` FOREIGN KEY (`department_id`) REFERENCES `folders_folder` (`id`),
  CONSTRAINT `fk_mous_mou_created_by_id` FOREIGN KEY (`created_by_id`) REFERENCES `users_customuser` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `mous_mou` WRITE;
INSERT INTO `mous_mou` (`id`, `title`, `mou_number`, `partner_organization`, `department_name`, `effective_date`, `signed_date`, `expiry_date`, `duration_months`, `status`, `summary`, `purpose`, `objectives`, `beneficiaries`, `opportunities`, `custom_fields_data`, `coordinator_name`, `coordinator_designation`, `coordinator_email`, `coordinator_phone`, `partner_name`, `partner_designation`, `partner_email`, `partner_phone`, `additional_notes`, `remarks`, `version_number`, `is_renewed`, `created_at`, `updated_at`, `created_by_id`, `department_id`, `original_mou_id`, `renewed_from_id`, `signed_mou_id`, `mou_type_id`) VALUES
(1, 'ABC Technologies Internship Agreement', 'MOU-2026-0001', 'ABC Tech Corp', 'Engineering', NULL, '2026-01-15', '2027-01-15', 12, 'Active', 'Strategic partnership agreement with ABC Tech Corp for internship opportunities.', 'To enhance student exposure and practical training in Engineering.', NULL, '["Students", "Faculty", "Institution"]', '["Internship", "Placement", "Training"]', '{}', 'Dr. Robert Smith', NULL, 'r.smith@college.edu', NULL, 'Sarah Jenkins', NULL, 'contact@abctechcorp.com', NULL, NULL, NULL, 1, 0, '2026-07-24 12:51:38.730191', '2026-07-24 12:51:38.730203', 2, NULL, NULL, NULL, NULL, 1),
(2, 'IIT Bombay Joint Research Initiative', 'MOU-2026-0002', 'IIT Bombay', 'Medical', NULL, '2025-08-10', '2027-08-10', 24, 'Active', 'Strategic partnership agreement with IIT Bombay for research opportunities.', 'To enhance student exposure and practical training in Medical.', NULL, '["Students", "Faculty", "Institution"]', '["Internship", "Placement", "Training"]', '{}', 'Dr. Robert Smith', NULL, 'r.smith@college.edu', NULL, 'Sarah Jenkins', NULL, 'contact@iitbombay.com', NULL, NULL, NULL, 1, 0, '2026-07-24 12:51:38.737099', '2026-07-24 12:51:38.737112', 2, NULL, NULL, NULL, NULL, 3),
(3, 'Infosys Placement & Recruitment Drive', 'MOU-2026-0003', 'Infosys Ltd', 'Engineering', NULL, '2026-07-01', '2027-07-01', 12, 'Pending Verification', 'Strategic partnership agreement with Infosys Ltd for placement opportunities.', 'To enhance student exposure and practical training in Engineering.', NULL, '["Students", "Faculty", "Institution"]', '["Internship", "Placement", "Training"]', '{}', 'Dr. Robert Smith', NULL, 'r.smith@college.edu', NULL, 'Sarah Jenkins', NULL, 'contact@infosysltd.com', NULL, NULL, NULL, 1, 0, '2026-07-24 12:51:38.744845', '2026-07-24 12:51:38.744863', 2, NULL, NULL, NULL, NULL, 2),
(4, 'TATA Motors Industrial Training', 'MOU-2026-0004', 'TATA Motors', 'Commerce', NULL, '2026-02-01', '2026-08-07', 6, 'Active', 'Strategic partnership agreement with TATA Motors for industry collaboration opportunities.', 'To enhance student exposure and practical training in Commerce.', NULL, '["Students", "Faculty", "Institution"]', '["Internship", "Placement", "Training"]', '{}', 'Dr. Robert Smith', NULL, 'r.smith@college.edu', NULL, 'Sarah Jenkins', NULL, 'contact@tatamotors.com', NULL, NULL, NULL, 1, 0, '2026-07-24 12:51:38.752817', '2026-07-24 12:51:38.752829', 2, NULL, NULL, NULL, NULL, 4);
UNLOCK TABLES;

DROP TABLE IF EXISTS `mous_moudocument`;
CREATE TABLE `mous_moudocument` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `document_type` varchar(50) NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `file_id` bigint NOT NULL,
  `mou_id` bigint NOT NULL,
  `uploaded_by_id` bigint NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mous_moudocument_uploaded_by_id` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users_customuser` (`id`),
  CONSTRAINT `fk_mous_moudocument_mou_id` FOREIGN KEY (`mou_id`) REFERENCES `mous_mou` (`id`),
  CONSTRAINT `fk_mous_moudocument_file_id` FOREIGN KEY (`file_id`) REFERENCES `files_file` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mous_mourenewal`;
CREATE TABLE `mous_mourenewal` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `renewed_at` datetime(6) NOT NULL,
  `notes` longtext NULL,
  `original_mou_id` bigint NOT NULL,
  `renewed_by_id` bigint NULL,
  `renewed_mou_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mous_mourenewal_renewed_mou_id` FOREIGN KEY (`renewed_mou_id`) REFERENCES `mous_mou` (`id`),
  CONSTRAINT `fk_mous_mourenewal_renewed_by_id` FOREIGN KEY (`renewed_by_id`) REFERENCES `users_customuser` (`id`),
  CONSTRAINT `fk_mous_mourenewal_original_mou_id` FOREIGN KEY (`original_mou_id`) REFERENCES `mous_mou` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mous_moutemplate`;
CREATE TABLE `mous_moutemplate` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` longtext NULL,
  `template_notes` longtext NULL,
  `fields_schema` longtext NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by_id` bigint NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_mous_moutemplate_1` (`name`),
  CONSTRAINT `fk_mous_moutemplate_created_by_id` FOREIGN KEY (`created_by_id`) REFERENCES `users_customuser` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `mous_moutemplate` WRITE;
INSERT INTO `mous_moutemplate` (`id`, `name`, `description`, `template_notes`, `fields_schema`, `is_active`, `created_at`, `updated_at`, `created_by_id`) VALUES
(1, 'Internship', 'MOU template for student industrial internship & practical training programs', 'Standard Internship template notes for coordinators.', '[{"name": "duration", "label": "Duration (Months)", "type": "number"}, {"name": "students_count", "label": "Eligible Students", "type": "number"}, {"name": "stipend", "label": "Monthly Stipend", "type": "text"}]', 1, '2026-07-24 12:51:38.699583', '2026-07-24 12:51:38.699598', NULL),
(2, 'Placement', 'Template for campus recruitment and placement partnerships', 'Standard Placement template notes for coordinators.', '[{"name": "eligible_depts", "label": "Eligible Departments", "type": "text"}, {"name": "package", "label": "Expected CTC Package", "type": "text"}, {"name": "selection_process", "label": "Selection Process", "type": "text"}]', 1, '2026-07-24 12:51:38.708307', '2026-07-24 12:51:38.708322', NULL),
(3, 'Research', 'Joint research collaboration, funding, & IP agreements', 'Standard Research template notes for coordinators.', '[{"name": "funding", "label": "Funding Amount ($)", "type": "text"}, {"name": "research_area", "label": "Research Domain", "type": "text"}, {"name": "principal_investigator", "label": "Principal Investigator", "type": "text"}]', 1, '2026-07-24 12:51:38.715168', '2026-07-24 12:51:38.715183', NULL),
(4, 'Industry Collaboration', 'General industry-academia partnership for workshops and labs', 'Standard Industry Collaboration template notes for coordinators.', '[{"name": "lab_setup", "label": "Co-Branded Lab Setup", "type": "text"}, {"name": "mentor", "label": "Industry Mentor", "type": "text"}]', 1, '2026-07-24 12:51:38.721597', '2026-07-24 12:51:38.721617', NULL);
UNLOCK TABLES;

DROP TABLE IF EXISTS `notifications_notification`;
CREATE TABLE `notifications_notification` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` longtext NOT NULL,
  `is_read` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  `metadata` longtext NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notifications_notification_user_id` FOREIGN KEY (`user_id`) REFERENCES `users_customuser` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `django_session`;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
