import { getEntityName } from "~/lib/surveys/helpers/getEntityName";
import EntityLabel from "~/components/common/EntityLabel";
import { FormattedMessage } from "~/components/common/FormattedMessage";
import {
  OPTION_NA,
  OptionMetadata,
  QuestionMetadata,
} from "@devographics/types";
import { getOptioni18nIds } from "@devographics/i18n";
import { useIntlContext } from "@devographics/react-i18n";

const OptionLabel = ({
  option,
  question,
}: {
  option: OptionMetadata;
  question: QuestionMetadata;
}) => {
  const intl = useIntlContext();
  const { entity, label } = option;

  if (label) {
    return label;
  }

  const i18n = getOptioni18nIds({ option, question });

  const defaultMessage =
    option.id === OPTION_NA
      ? intl.formatMessage({ id: "options.na" })
      : i18n.base + " ❔";

  const entityName = getEntityName(entity);

  return entityName ? (
    <EntityLabel entity={entity} />
  ) : (
    <FormattedMessage id={i18n.base} defaultMessage={defaultMessage} />
  );
};

export default OptionLabel;
