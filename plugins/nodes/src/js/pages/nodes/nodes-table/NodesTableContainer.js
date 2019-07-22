import mixin from "reactjs-mixin";
import React from "react";
import { StoreMixin } from "mesosphere-shared-reactjs";
import { map, catchError } from "rxjs/operators";
import { combineLatest, of } from "rxjs";
import { graphqlObservable, componentFromStream } from "@dcos/data-service";
import gql from "graphql-tag";

import CompositeState from "#SRC/js/structs/CompositeState";
import NodesList from "#SRC/js/structs/NodesList";
import Node from "#SRC/js/structs/Node";
import { default as schema } from "#PLUGINS/nodes/src/js/data/NodesNetworkResolver";
import NodesTable from "#PLUGINS/nodes/src/js/components/NodesTable";

class NodesTableContainer extends mixin(StoreMixin) {
  constructor() {
    super(...arguments);

    this.state = {
      filteredNodes: null,
      filters: { health: "all", name: "", service: null },
      masterRegion: null
    };
    this.store_listeners = [
      {
        events: ["success"],
        listenAlways: false,
        name: "nodeHealth",
        suppressUpdate: true
      },
      { name: "state", events: ["success"], suppressUpdate: true }
    ];
  }

  componentWillMount() {
    this.onStateStoreSuccess();
    const { location, hosts, networks } = this.props;

    const filters = {
      health: location.query.filterHealth || "all",
      name: location.query.searchString || "",
      service: location.query.filterService || null
    };

    this.setFilters(hosts, networks, filters);
  }

  componentWillReceiveProps(nextProps) {
    const { location, hosts, networks } = nextProps;
    const filters = {
      health: location.query.filterHealth || "all",
      name: location.query.searchString || "",
      service: location.query.filterService || null
    };

    // when trying to optimize here, please account for data that may change in `hosts`,
    // like `TASK_RUNNING`, `resources.*` or `drain_info`.
    this.setFilters(hosts, networks, filters);
  }

  getFilteredNodes(filters = this.state.filters) {
    const { networks = [] } = this.props;

    return new NodesList({
      items: this.props.hosts.getItems().map(node => {
        const hostname = node.getHostName();
        const network = networks.find(
          network => network.private_ip === hostname
        );

        if (network == null) {
          return node;
        }

        return new Node({ ...node.toJSON(), network });
      })
    }).filter(filters);
  }

  // TODO: remove set Filters and only filter at the top level;
  setFilters(nodes, networks = [], newFilters, callback) {
    if (newFilters.service === "") {
      newFilters.service = null;
    }

    const newNodes = new NodesList({
      items: nodes.getItems().map(node => {
        const hostname = node.getHostName();
        const network = networks.find(
          network => network.private_ip === hostname
        );

        if (network == null) {
          return node;
        }

        return new Node({ ...node.toJSON(), network });
      })
    });
    const filters = Object.assign({}, this.state.filters, newFilters);
    const filteredNodes = newNodes.filter(filters);

    this.setState({ filters, filteredNodes }, callback);
  }

  onNodeHealthStoreSuccess() {
    this.setState({ filteredNodes: this.getFilteredNodes() });
  }

  onStateStoreSuccess() {
    this.setState({
      masterRegion: CompositeState.getMasterNode().getRegionName()
    });
  }

  render() {
    const { filteredNodes, masterRegion } = this.state;
    const { networks = [] } = this.props;

    // Detecting whether DCOS already supports maintenance mode.
    // We might want to remove this flag at some point in the future.
    return (
      <NodesTable
        withPublicIP={networks.length > 0}
        hosts={filteredNodes}
        masterRegion={masterRegion}
      />
    );
  }
}

const networks$ = graphqlObservable(
  gql`
    query {
      networks(privateIP: $privateIP) {
        public_ips
        private_ip
      }
    }
  `,
  schema,
  {}
).pipe(
  map(response => response.data.networks),
  catchError(() => of([]))
);

module.exports = componentFromStream(props$ =>
  combineLatest(props$, networks$).pipe(
    map(([props, networks]) => (
      <NodesTableContainer {...props} networks={networks} />
    ))
  )
);
