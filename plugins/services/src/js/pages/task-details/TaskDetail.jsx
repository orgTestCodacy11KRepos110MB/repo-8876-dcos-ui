import { Trans } from "@lingui/macro";
import { i18nMark } from "@lingui/react";
import mixin from "reactjs-mixin";
import PropTypes from "prop-types";
import React from "react";
import { routerShape, formatPattern } from "react-router";

import DCOSStore from "#SRC/js/stores/DCOSStore";
import DetailViewHeader from "#SRC/js/components/DetailViewHeader";
import Loader from "#SRC/js/components/Loader";
import ManualBreadcrumbs from "#SRC/js/components/ManualBreadcrumbs";
import MesosStateStore from "#SRC/js/stores/MesosStateStore";
import RequestErrorMsg from "#SRC/js/components/RequestErrorMsg";
import RouterUtil from "#SRC/js/utils/RouterUtil";
import StoreMixin from "#SRC/js/mixins/StoreMixin";
import TabsMixin from "#SRC/js/mixins/TabsMixin";

import TaskDirectoryStore from "../../stores/TaskDirectoryStore";
import TaskStates from "../../constants/TaskStates";

const METHODS_TO_BIND = [
  "handleBreadcrumbClick",
  "handleOpenLogClick",
  "onTaskDirectoryStoreError",
  "onTaskDirectoryStoreSuccess"
];

// TODO remove
const HIDE_BREADCRUMBS = [
  "/jobs/detail/:id",
  "/networking/networks/:overlayName",
  "/nodes/:nodeID",
  "/services/detail/:id"
].reduce(
  (acc, prefix) =>
    acc.concat(
      [
        "tasks/:taskID/console",
        "tasks/:taskID/details",
        "tasks/:taskID/logs",
        "tasks/:taskID/logs/:filePath",
        "tasks/:taskID/files/view(/:filePath(/:innerPath))"
      ].map(suffix => `${prefix}/${suffix}`)
    ),
  []
);

class TaskDetail extends mixin(TabsMixin, StoreMixin) {
  constructor(...args) {
    super(...args);

    this.tabs_tabs = {};

    this.state = {
      directory: null,
      expandClass: "large",
      selectedLogFile: null,
      taskDirectoryErrorCount: 0
    };

    this.store_listeners = [
      { name: "marathon", events: ["appsSuccess"], listenAlways: false },
      { name: "state", events: ["success"], listenAlways: false },
      { name: "summary", events: ["success"], listenAlways: false },
      {
        name: "taskDirectory",
        events: ["error", "success", "nodeStateError", "nodeStateSuccess"],
        suppressUpdate: true
      }
    ];

    METHODS_TO_BIND.forEach(method => {
      this[method] = this[method].bind(this);
    });

    this.onTaskDirectoryStoreNodeStateError = this.onTaskDirectoryStoreError;
    this.onTaskDirectoryStoreNodeStateSuccess = this.onTaskDirectoryStoreSuccess;
  }

  UNSAFE_componentWillMount() {
    const { routes } = this.props;

    // TODO: DCOS-7871 Refactor the TabsMixin to generalize this solution:
    const topRouteIndex = routes.findIndex(
      ({ component }) => component === TaskDetail
    );
    const topRoute = routes[topRouteIndex];

    const parentRoutes = routes.slice(0, topRouteIndex + 1);
    const parentPath = RouterUtil.reconstructPathFromRoutes(parentRoutes);

    if (topRoute != null) {
      this.tabs_tabs = topRoute.childRoutes
        .filter(({ isTab }) => !!isTab)
        .reduce((tabs, { path, title }) => {
          const key = path ? `${parentPath}/${path}` : parentPath;
          tabs[key] = title || path;

          return tabs;
        }, this.tabs_tabs);

      this.updateCurrentTab();
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { innerPath, taskID } = this.props.params;
    if (
      nextProps.params.innerPath !== innerPath ||
      nextProps.params.taskID !== taskID
    ) {
      this.setState({ directory: null });
    }

    this.updateCurrentTab(nextProps);
  }

  updateCurrentTab(nextProps) {
    const { routes } = nextProps || this.props;
    const currentTab = RouterUtil.reconstructPathFromRoutes(routes);
    if (currentTab != null) {
      this.setState({ currentTab });
    }
  }

  componentDidMount(...args) {
    super.componentDidMount(...args);
    this.store_removeEventListenerForStoreID("summary", "success");
  }

  onStateStoreSuccess() {
    this.handleFetchDirectory();
  }

  onTaskDirectoryStoreError() {
    this.setState({
      taskDirectoryErrorCount: this.state.taskDirectoryErrorCount + 1
    });
  }

  onTaskDirectoryStoreSuccess(taskID) {
    if (this.props.params.taskID !== taskID) {
      this.handleFetchDirectory();

      return;
    }

    const directory = TaskDirectoryStore.get("directory");
    this.setState({ directory, taskDirectoryErrorCount: 0 });
  }

  handleFetchDirectory() {
    const { params } = this.props;
    const task = MesosStateStore.getTaskFromTaskID(params.taskID);
    // Declare undefined to not override default values in fetchDirectory
    let innerPath;

    if (params.innerPath != null) {
      innerPath = decodeURIComponent(params.innerPath);
    }

    if (task != null) {
      TaskDirectoryStore.fetchDirectory(task, innerPath);
    }

    this.setState({ directory: null });
  }

  handleBreadcrumbClick(path) {
    const { router } = this.context;
    const { params, routes } = this.props;
    const task = MesosStateStore.getTaskFromTaskID(params.taskID);
    if (task != null) {
      TaskDirectoryStore.setPath(task, path);
    }
    // Transition to parent route, which uses a default route
    const parentPath = RouterUtil.reconstructPathFromRoutes(routes);
    router.push(formatPattern(parentPath, params));
  }

  getErrorScreen() {
    return (
      <div className="pod">
        <RequestErrorMsg />
      </div>
    );
  }

  hasVolumes(service) {
    return !!service && service.getVolumes().getItems().length > 0;
  }

  hasLoadingError() {
    return this.state.taskDirectoryErrorCount >= 3;
  }

  handleOpenLogClick(selectedLogFile) {
    const { router } = this.context;
    const routes = this.props.routes;
    const params = {
      ...this.props.params,
      filePath: encodeURIComponent(selectedLogFile.get("path")),
      innerPath: encodeURIComponent(TaskDirectoryStore.get("innerPath"))
    };
    const { fileViewerRoutePath } = routes[routes.length - 1];
    router.push(formatPattern(fileViewerRoutePath, params));
  }

  getBasicInfo() {
    const { selectedLogFile } = this.state;
    const task = MesosStateStore.getTaskFromTaskID(this.props.params.taskID);

    if (task == null) {
      return null;
    }

    const service = DCOSStore.serviceTree.getServiceFromTaskID(task.getId());
    const taskIcon = <img src={task.getImages()["icon-large"]} />;
    const filePath = (selectedLogFile && selectedLogFile.get("path")) || null;
    const params = {
      filePath,
      ...this.props.params
    };

    let tabsArray = this.tabs_getRoutedTabs({ params }) || [];

    if (!this.hasVolumes(service)) {
      tabsArray = tabsArray.filter(tab => {
        if (
          tab.key === "/nodes/:nodeID/tasks/:taskID/volumes(/:volumeID)" ||
          tab.key === "/services/detail/:id/tasks/:taskID/volumes"
        ) {
          return false;
        }

        return true;
      });
    }

    const navigationTabs = <ul className="menu-tabbed">{tabsArray}</ul>;

    const taskState = task.get("state");
    const serviceStatus = TaskStates[taskState].displayName;

    return (
      <DetailViewHeader
        icon={taskIcon}
        iconClassName="icon-app-container  icon-image-container"
        subTitle={<Trans render="span" id={serviceStatus} />}
        navigationTabs={navigationTabs}
        title={task.getName()}
      />
    );
  }

  tabs_handleTabClick(...args) {
    this.setState({ selectedLogFile: null });

    // Only call super after we are done removing/adding listeners
    super.tabs_handleTabClick(...args);
  }

  getNotFound(item, itemID) {
    return (
      <div className="pod flush-right flush-left text-align-center">
        <Trans render="h3" className="flush-top text-align-center">
          Error finding {item}
        </Trans>
        <Trans render="p" className="flush">
          Did not find a {item} with id "{itemID}"
        </Trans>
      </div>
    );
  }

  getBreadcrumbs() {
    const path = RouterUtil.reconstructPathFromRoutes(this.props.routes);
    if (HIDE_BREADCRUMBS.includes(path)) {
      return null;
    }

    const innerPath = TaskDirectoryStore.get("innerPath").split("/");
    let onClickPath = "";
    const crumbs = innerPath.map((directoryItem, index) => {
      let textValue = directoryItem;

      // First breadcrumb is always 'Working Directory'.
      if (index === 0) {
        textValue = i18nMark("Working Directory");
      } else {
        onClickPath += `/${directoryItem}`;
      }

      return {
        className: "clickable",
        label: textValue,
        onClick: this.handleBreadcrumbClick.bind(this, onClickPath)
      };
    });

    return <ManualBreadcrumbs crumbs={crumbs} />;
  }

  getSubView() {
    const task = MesosStateStore.getTaskFromTaskID(this.props.params.taskID);
    const { directory, selectedLogFile } = this.state;
    if (this.hasLoadingError()) {
      return this.getErrorScreen();
    }

    if (!directory || !task) {
      return <Loader />;
    }
    const service = DCOSStore.serviceTree.getServiceFromTaskID(task.getId());

    return (
      <div className="flex flex-direction-top-to-bottom flex-item-grow-1 flex-item-shrink-1">
        {this.props.children &&
          React.cloneElement(this.props.children, {
            directory,
            selectedLogFile,
            task,
            onOpenLogClick: this.handleOpenLogClick,
            service
          })}
      </div>
    );
  }

  render() {
    if (MesosStateStore.get("lastMesosState").slaves == null) {
      return null;
    }

    return (
      <div className="flex flex-direction-top-to-bottom flex-item-grow-1 flex-item-shrink-1">
        <div className="flex flex-item-shrink-0 control-group">
          {this.getBreadcrumbs()}
        </div>
        {this.getSubView()}
      </div>
    );
  }
}

TaskDetail.contextTypes = {
  router: routerShape
};

TaskDetail.propTypes = {
  params: PropTypes.object,
  routes: PropTypes.array
};

export default TaskDetail;