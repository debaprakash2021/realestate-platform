const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on-hold',
  CANCELLED: 'cancelled'
};

const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done'
};

const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

const JWT_CONFIG = {
  EXPIRE: '7d',
  COOKIE_EXPIRE: 7
};

module.exports = {
  USER_ROLES,
  PROJECT_STATUS,
  TASK_STATUS,
  PRIORITY,
  JWT_CONFIG
};
