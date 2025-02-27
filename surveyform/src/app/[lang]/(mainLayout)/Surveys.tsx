import Link from "next/link";
import { SurveyStatusEnum } from "@devographics/types";
import { FormattedMessage } from "~/components/common/FormattedMessage";
import { EditionMetadata, SurveyMetadata } from "@devographics/types";
import { getSurveyImageUrl } from "~/lib/surveys/helpers/getSurveyImageUrl";
import { getEditionTitle } from "~/lib/surveys/helpers/getEditionTitle";
import { getEditionHomePath } from "~/lib/surveys/helpers/getEditionHomePath";
import sortBy from "lodash/sortBy";
import { rscCurrentUserWithResponses } from "~/account/user/rsc-fetchers/rscCurrentUser";
import { ResponseDetails } from "~/components/surveys/ResponseDetails";

const EditionItem = async ({
  edition,
  homePath,
}: {
  edition: EditionMetadata;
  homePath: string;
}) => {
  const { survey, year, status } = edition;
  const { name } = survey;
  const imageUrl = getSurveyImageUrl(edition);

  const currentUser = await rscCurrentUserWithResponses();
  const response = currentUser?.responses?.find(
    (r) => r.editionId === edition.id
  );

  return (
    <div className="survey-item">
      <div>
        <div className="survey-image">
          <Link href={homePath} className="survey-link">
            <div className="survey-image-inner">
              {imageUrl && (
                <img
                  /*
                  priority={
                    typeof status !== "undefined" && [1, 2].includes(status)
                  }*/
                  width={300}
                  height={200}
                  src={imageUrl}
                  alt={getEditionTitle({ edition })}
                  //quality={100}
                />
              )}
            </div>
            <span className="survey-name">
              <span>
                {name} {year}
              </span>
            </span>
          </Link>
        </div>
      </div>
      {response && <ResponseDetails edition={edition} response={response} />}
    </div>
  );
};

const EditionGroup = ({
  allEditions,
  status,
  localeId,
}: {
  allEditions: Array<EditionMetadata>;
  status: SurveyStatusEnum;
  localeId: string;
}) => {
  if (!status) throw new Error("SurveyGroup must receive a defined status");
  const filteredEditions = allEditions.filter((s) => s.status === status);
  const sortedEdition = sortBy(
    filteredEditions,
    (edition: EditionMetadata) => new Date(edition.startedAt)
  ).reverse();
  // const { locale } = useLocaleContext();
  const locale = { id: localeId };
  return (
    <div className="surveys-group">
      <h3 className="surveys-group-heading">
        <FormattedMessage
          id={`general.${SurveyStatusEnum[status].toLowerCase()}_surveys`}
        />
      </h3>
      {sortedEdition.length > 0 ? (
        sortedEdition.map((edition) => (
          <EditionItem
            key={edition.id}
            edition={edition}
            homePath={getEditionHomePath({ edition, locale })}
          />
        ))
      ) : (
        <div className={`surveys-none surveys-no${status}`}>
          <FormattedMessage
            id={`general.no_${SurveyStatusEnum[status].toLowerCase()}_surveys`}
          />
        </div>
      )}
    </div>
  );
};

const Surveys = ({
  surveys,
  localeId,
}: {
  surveys: Array<SurveyMetadata>;
  localeId: string;
}) => {
  const allEditions = surveys
    .map((survey) => survey.editions.map((e) => ({ ...e, survey })))
    .flat();
  return (
    <div className="surveys">
      {/* FIXME won't load useLocaleContext correctly... <LocaleSelector />*/}
      <EditionGroup
        allEditions={allEditions}
        status={SurveyStatusEnum.OPEN}
        localeId={localeId}
      />
      <EditionGroup
        allEditions={allEditions}
        status={SurveyStatusEnum.PREVIEW}
        localeId={localeId}
      />
      <EditionGroup
        allEditions={allEditions}
        status={SurveyStatusEnum.CLOSED}
        localeId={localeId}
      />
      {/*<Translators />*/}
    </div>
  );
};

export default Surveys;
