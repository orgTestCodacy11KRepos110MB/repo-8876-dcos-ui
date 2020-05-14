import Config from "#SRC/js/config/Config";
import Item from "#SRC/js/structs/Item";
import { getWebURL } from "#PLUGINS/services/src/js/utils/ServiceUtil";

import HealthStatus from "../constants/HealthStatus";
import ServiceImages from "../constants/ServiceImages";
import * as ServiceStatus from "../constants/ServiceStatus";
import ServiceSpec from "./ServiceSpec";

export default class Service extends Item {
  resourceLimits?: {
    cpus?: "unlimited" | number;
    mem?: "unlimited" | number;
  };
  constructor(...args) {
    super(...args);
    this._regions = undefined;
  }
  getId() {
    return this.get("id") || "";
  }

  getMesosId() {
    return this.getId().split("/").slice(1).join("_");
  }

  getName() {
    return this.getId().split("/").pop();
  }

  getSpec() {
    return new ServiceSpec(this.get());
  }

  getHealth() {
    return HealthStatus.NA;
  }

  getLabels() {
    return {};
  }

  getVolumes() {
    return [];
  }

  getStatus() {
    return this.getServiceStatus().displayName;
  }

  getServiceStatus() {
    return ServiceStatus.NA;
  }

  getRegions() {
    if (!this._regions) {
      const regionCounts = (this.get("tasks") || []).reduce(
        (regions, { region }) => {
          if (region) {
            regions[region] = regions[region] ? regions[region] + 1 : 1;
          }

          return regions;
        },
        {}
      );

      this._regions = Object.keys(regionCounts).sort();
    }

    return this._regions;
  }

  getImages() {
    return ServiceImages.NA_IMAGES;
  }

  getQueue() {
    return null;
  }

  getWebURL() {
    return getWebURL(this.getLabels(), Config.rootUrl);
  }

  getVersion() {
    return "";
  }

  getInstancesCount() {
    return 0;
  }

  getRunningInstancesCount() {
    return (this.get("tasks") || []).length;
  }

  getTasksSummary() {
    return {
      tasksHealthy: 0,
      tasksStaged: 0,
      tasksUnhealthy: 0,
      tasksUnknown: 0,
      tasksOverCapacity: 0,
      tasksRunning: 0,
    };
  }

  getResources() {
    const instances = this.getInstancesCount();
    const {
      cpus = 0,
      mem = 0,
      gpus = 0,
      disk = 0,
    } = this.getSpec().getResources();
    let executorCpus = 0;
    let executorMem = 0;
    let executorGpus = 0;
    let executorDisk = 0;

    if (this.getSpec().get("executorResources")) {
      const executor = this.getSpec().get("executorResources");
      executorCpus = executor.cpus ? executor.cpus : 0;
      executorMem = executor.mem ? executor.mem : 0;
      executorGpus = executor.gpus ? executor.gpus : 0;
      executorDisk = executor.disk ? executor.disk : 0;
    }

    return {
      cpus: (cpus + executorCpus) * instances,
      mem: (mem + executorMem) * instances,
      gpus: (gpus + executorGpus) * instances,
      disk: (disk + executorDisk) * instances,
    };
  }

  getRole() {
    return this.get("role") || "";
  }

  getRootGroupName() {
    return this.getId().split("/")[1];
  }

  getQuotaRoleStats(roleName, getMesosTasksByService) {
    const mesosTasks = getMesosTasksByService(this);
    const tasks = this.get("tasks");

    return mesosTasks.reduce(
      (roles, mesosTask) => {
        const item = tasks.find((t) => t.id === mesosTask.id);
        roles.count++;

        if (!item) {
          return roles;
        }

        const itemRole = item.role;
        if (itemRole) {
          roles.rolesCount++;
          if (itemRole === roleName) {
            roles.groupRoleCount++;
          }
        }
        return roles;
      },
      { count: 0, rolesCount: 0, groupRoleCount: 0 }
    );
  }
}
