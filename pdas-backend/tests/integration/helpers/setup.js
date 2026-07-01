const { mock } = require("node:test");
const crypto = require("crypto");

// Mock default behaviors for Sequelize models
class MockModel {
  constructor(name) {
    this.name = name;
    this.records = [];
  }
  
  decorate(record) {
    if (!record) return record;
    if (!record.save) {
      Object.defineProperty(record, "save", {
        enumerable: false,
        value: async () => record,
      });
    }
    if (!record.update) {
      Object.defineProperty(record, "update", {
        enumerable: false,
        value: async (values) => Object.assign(record, values),
      });
    }
    if (!record.destroy) {
      Object.defineProperty(record, "destroy", {
        enumerable: false,
        value: async () => 1,
      });
    }
    if (!record.toJSON) {
      Object.defineProperty(record, "toJSON", {
        enumerable: false,
        value: () => ({ ...record }),
      });
    }
    return record;
  }

  async findOne(options = {}) {
    if (options.where) {
      return this.decorate(this.records.find(r => {
        return Object.entries(options.where).every(([k, v]) => r[k] === v);
      }) || null);
    }
    return this.decorate(this.records[0] || null);
  }
  async findByPk(id) {
    return this.decorate(this.records.find(r => r.id === id || r.key === id || r.user_id === id || r.report_id === id || r.scan_id === id || r.job_id === id) || null);
  }
  async findAll() { return this.records.map((record) => this.decorate(record)); }
  async findAndCountAll() { return { rows: await this.findAll(), count: this.records.length }; }
  async create(data) { 
    const record = this.decorate({ ...data, id: "mock-" + crypto.randomUUID(), _model: this.name });
    this.records.push(record);
    return record; 
  }
  async update(data) { return [1]; }
  async destroy() { return 1; }
  async count() { return this.records.length; }
  scope() { return this; }
  build(data) { return { ...data, save: async () => this.create(data) }; }
}

process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";
process.env.MAIL_HOST = "";
process.env.MAIL_USER = "";
process.env.MAIL_PASS = "";
process.env.GOOGLE_SAFE_BROWSING_ENABLED = "false";
process.env.VIRUSTOTAL_ENABLED = "false";
process.env.GOOGLE_SAFE_BROWSING_API_KEY = "";
process.env.VIRUSTOTAL_API_KEY = "";

const mockDb = {
  User: new MockModel("User"),
  Report: new MockModel("Report"),
  ScanResult: new MockModel("ScanResult"),
  ScanJob: new MockModel("ScanJob"),
  Notification: new MockModel("Notification"),
  AwarenessContent: new MockModel("AwarenessContent"),
  ThreatIntelligence: new MockModel("ThreatIntelligence"),
  AuditLog: new MockModel("AuditLog"),
  RefreshToken: new MockModel("RefreshToken"),
  PasswordResetToken: new MockModel("PasswordResetToken"),
  EmailVerificationToken: new MockModel("EmailVerificationToken"),
  PendingRegistration: new MockModel("PendingRegistration"),
  ReportComment: new MockModel("ReportComment"),
  SystemSetting: new MockModel("SystemSetting"),
  SecurityEvent: new MockModel("SecurityEvent"),
};

mockDb.User.records = [
  { user_id: "admin-1", role: "admin", is_active: true, email: "admin@example.com" },
  { user_id: "user-1", role: "user", is_active: true, email: "user@example.com" }
];

mockDb.sequelize = {
  transaction: async (cb) => {
    return typeof cb === 'function' ? await cb({}) : {};
  },
  authenticate: async () => true,
  query: async () => [[]],
  fn: (name, value) => ({ fn: name, value }),
  col: (name) => ({ col: name }),
  define: (name, schema, options) => mockDb[name] || new MockModel(name)
};

// Override the module before anyone requires app
const originalRequire = require("node:module").prototype.require;
require("node:module").prototype.require = function(path) {
  if (path === "../models" || path === "../../models" || path.endsWith("models") || path.endsWith("models/index.js")) {
    return mockDb;
  }
  if (path === "../config/sequelize" || path === "../../config/sequelize" || path.endsWith("config/sequelize")) {
    return { sequelize: mockDb.sequelize };
  }
  return originalRequire.apply(this, arguments);
};

// Now require the app
const app = require("../../../src/app");
// We need to mock some services that might do network calls
const mailService = require("../../../src/services/mailService");
mock.method(mailService, "sendMail", async () => ({ messageId: "mock-id" }));

const createAgent = () => {
  // Simple HTTP fetch wrapper to talk to the local express app without a port
  // Wait, we need the app to listen or we use raw HTTP requests.
  // We'll just spin it up on a random port.
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      const baseUrl = `http://127.0.0.1:${port}`;
      
      const request = async (method, path, options = {}) => {
        const { body, headers = {} } = options;
        const fetchOptions = {
          method,
          headers: { "Content-Type": "application/json", ...headers },
        };
        if (body) {
          fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
        }
        
        const res = await fetch(`${baseUrl}${path}`, fetchOptions);
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch(e) {}
        
        return {
          status: res.status,
          headers: res.headers,
          body: json || text
        };
      };

      resolve({
        server,
        request,
        get: (p, o) => request("GET", p, o),
        post: (p, o) => request("POST", p, o),
        put: (p, o) => request("PUT", p, o),
        patch: (p, o) => request("PATCH", p, o),
        delete: (p, o) => request("DELETE", p, o),
        close: () => new Promise(r => server.close(r))
      });
    });
  });
};

const signAccessToken = require("../../../src/utils/authTokens").signAccessToken;

const createAdminToken = () => {
  return signAccessToken({ user_id: "admin-1", role: "admin" });
};

const createUserToken = () => {
  return signAccessToken({ user_id: "user-1", role: "user" });
};

module.exports = {
  createAgent,
  createAdminToken,
  createUserToken,
  mockDb
};
