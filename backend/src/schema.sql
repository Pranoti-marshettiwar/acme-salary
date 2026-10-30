CREATE TABLE IF NOT EXISTS employees (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(120) NOT NULL,
  email       VARCHAR(190) NOT NULL,
  country     VARCHAR(60)  NOT NULL,
  department  VARCHAR(60)  NOT NULL,
  job_title   VARCHAR(100) NOT NULL,
  currency    CHAR(3)      NOT NULL,
  salary      DECIMAL(14,2) NOT NULL,
  hire_date   DATE         NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_salary_positive CHECK (salary > 0),
  UNIQUE KEY uq_email (email),
  KEY idx_country_salary (country, salary),
  KEY idx_department_salary (department, salary),
  KEY idx_name (full_name),
  KEY idx_salary (salary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
