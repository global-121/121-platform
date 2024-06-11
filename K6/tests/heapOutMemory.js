import { describe, expect } from "https://jslib.k6.io/k6chaijs/4.3.4.3/index.js";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import permissionModel from "../../models/permissionModel.js";
import { Httpx } from "https://jslib.k6.io/httpx/0.0.1/index.js";

var permissionPage = new permissionModel();
const env = JSON.parse(open("../../helper/env.json"));
let auth;
let results;

export let options = {
      thresholds: {
            http_req_failed: ["rate<0.01"],
            "http_req_duration{name:createRole}": ["avg<5000", "p(95)<=5000", "max<=5000"],
            "http_req_duration{name:getRoles}": ["avg<5000", "p(95)<=5000", "max<=5000"],
            "http_req_duration{name:updateRoles}": ["avg<5000", "p(95)<=5000", "max<=5000"],
            "http_req_duration{name:deleteRole}": ["avg<5000", "p(95)<=5000", "max<=5000"]
      }
};
const session = new Httpx({
      headers: {
            accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
      }
});
export function setup() {
      if (__ENV.URL === env.staging) {
            auth = authenticateFlow();
      } else if (__ENV.URL === env.qa) {
            auth = authenticateFlowQA();
      }
      return {
            cookie: auth.wodan,
            session: auth.session
      };
}
export default function testSuite(data) {
      session.addHeader("cookie", `PHPSESSID=${data.session}; WodanCookie=${data.cookie};`);

      describe("Update Role", () => {
            var randomFirstName = randomString(8);
            var newName = randomString(8)

            session.addTag("name", "createRole");
            var verifyRoleIsCreated = permissionPage.createRole(session, randomFirstName);
            expect(verifyRoleIsCreated, "Role is created").to.equal(201);

            session.addTag("name", "getRoles");
            var verifyRolesPageIsLoaded = permissionPage.getRoles(session);
            results = verifyRolesPageIsLoaded.json().roles.filter((item) => item.label === randomFirstName);
            var roleId = results[0].id;

            session.addTag("name", "updateRoleName");
            var verifyRoleNameIsUpdated = permissionPage.updateRoles(session, roleId, newName);
            expect(verifyRoleNameIsUpdated.status, "Role is updated").to.equal(200);

            var verifyRolesPageIsLoaded = permissionPage.getRoles(session);
            results = verifyRolesPageIsLoaded.json().roles.filter((item) => item.label === newName);
            console.log(results[0].label)
            expect(results[0].label, "Find newly updated role").to.equal(newName);

            session.addTag("name", "deleteRole");
            results = verifyRolesPageIsLoaded.json()["roles"].filter((item) => item.label === newName);
            expect(results[0].label, "Find newly created role").to.equal(newName);

            var roleId = results[0].id;
            var verifyRoleIsDeleted = permissionPage.deleteRole(session, roleId);

            expect(verifyRoleIsDeleted.status, "Get list of all roles").to.equal(200);

            var verifyRoleDoesNotShowInOverview = permissionPage.getRoles(session);
            var roles = verifyRoleDoesNotShowInOverview.json()["roles"];
            const roleIsNotPresent = !roles.some((role) => role.label === newName);

            expect(roleIsNotPresent, "Role is deleted").to.be.true;
      });
}
