import * as React from "react";
import { I18n, i18nMark } from "@lingui/core";
import { Trans } from "@lingui/macro";
import FullScreenModalHeader from "#SRC/js/components/modals/FullScreenModalHeader";
import FullScreenModalHeaderActions from "#SRC/js/components/modals/FullScreenModalHeaderActions";
import FullScreenModalHeaderTitle from "#SRC/js/components/modals/FullScreenModalHeaderTitle";

interface GroupModalHeaderProps {
  i18n: I18n;
  isEdit: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default (props: GroupModalHeaderProps) => {
  const { i18n, isEdit, onClose, onSave } = props;
  const cancelLabel = i18n._(i18nMark("Cancel"));
  const saveLabel = isEdit
    ? i18n._(i18nMark("Update"))
    : i18n._(i18nMark("Create"));
  return (
    <FullScreenModalHeader>
      <FullScreenModalHeaderActions
        actions={[
          {
            className: "button-primary-link button-flush-horizontal",
            clickHandler: onClose,
            label: cancelLabel
          }
        ]}
        type="secondary"
      />
      <FullScreenModalHeaderTitle>
        {isEdit ? <Trans>Edit Group</Trans> : <Trans>New Group</Trans>}
      </FullScreenModalHeaderTitle>
      <FullScreenModalHeaderActions
        actions={[
          {
            className: "button-primary flush-vertical",
            clickHandler: onSave,
            label: saveLabel
          }
        ]}
        type="primary"
      />
    </FullScreenModalHeader>
  );
};