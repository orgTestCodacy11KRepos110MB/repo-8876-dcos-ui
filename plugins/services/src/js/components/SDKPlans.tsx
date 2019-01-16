import * as React from "react";

import { componentFromStream, graphqlObservable } from "@dcos/data-service";
import { BehaviorSubject, Observable } from "rxjs";
import gql from "graphql-tag";
import Loader from "#SRC/js/components/Loader";
import RequestErrorMsg from "#SRC/js/components/RequestErrorMsg";
import { Service, compare as ServiceCompare } from "../types/Service";
import { default as schema } from "../data";
import SDKPlansScreen from "#PLUGINS/services/src/js/components/SDKPlansScreen";

const getGraphQL = (
  serviceName: string
): Observable<{ data: { service: Service } }> => {
  return graphqlObservable(
    gql`
      query {
        service(name: $serviceName) {
          name
          plans {
            name
            errors
            phases
            status
            strategy
          }
        }
      }
    `,
    schema,
    { serviceName }
  );
};

const ErrorScreen = () => {
  return <RequestErrorMsg />;
};

const LoadingScreen = () => {
  return <Loader />;
};

const selectedPlan$ = new BehaviorSubject<string>("");
const handleSelectPlan = (name: string) => {
  selectedPlan$.next(name);
};

const SDKPlans = componentFromStream(props$ => {
  const name$ = (props$ as Observable<{ service: { getId: () => string } }>)
    .map((props: { service: { getId: () => string } }) => props.service.getId())
    .distinctUntilChanged();

  const plans$ = name$
    .concatMap((serviceName: string) =>
      getGraphQL(serviceName).map(
        (response: { data: { service: Service } }) => response.data.service
      )
    )
    .distinctUntilChanged(ServiceCompare);

  return Observable.combineLatest([plans$, selectedPlan$])
    .map(([service, selectedPlan], index: number) => {
      return (
        <SDKPlansScreen
          key={index}
          service={service}
          plan={selectedPlan}
          handleSelectPlan={handleSelectPlan}
        />
      );
    })
    .retryWhen(errors =>
      errors
        .delay(1000)
        .take(10)
        .concat(Observable.throw(errors))
    )
    .catch(() => Observable.of(<ErrorScreen />))
    .startWith(<LoadingScreen />);
});

export default SDKPlans;