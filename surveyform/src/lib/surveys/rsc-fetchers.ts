import { cache } from "react";
import { fetchSurveysMetadata } from "@devographics/fetch";
import type { Metadata } from "next";
import { publicConfig } from "~/config/public";
import { rscMustGetSurveyEditionFromUrl } from "~/app/[lang]/survey/[slug]/[year]/rsc-fetchers";
import { getCommonContexts, getEditionContexts } from "~/i18n/config";
import { rscIntlContext } from "~/i18n/rsc-fetchers";
import { getEditionTitle } from "~/lib/surveys/helpers/getEditionTitle";
import { getSurveyImageUrl } from "~/lib/surveys/helpers/getSurveyImageUrl";
import { getSectioni18nIds } from "@devographics/i18n";
import { FetcherFunctionOptions } from "@devographics/fetch/types";
import { serverConfig } from "~/config/server";

export const rscFetchSurveysMetadata = cache(async (options?: FetcherFunctionOptions) => {
  const result = await fetchSurveysMetadata({
    ...options,
    calledFrom: __filename,
    getServerConfig: serverConfig
  });
  // remove survey editions with no questions
  result.data = result.data?.map((survey) => ({
    ...survey,
    editions: survey?.editions?.filter(
      (edition) => edition?.sections?.length > 0
    ),
  }));
  return result;
});

/**
 * TODO: this is actually used by "generateMetadata" functions
 * => is it ok to use "rsc" functions here? Not sure, we should call the underlying functions probably
 * as there is no nesting here
 */
export const rscGetMetadata = async ({
  params,
}: {
  params: { lang: string; sectionNumber?: string; slug: string; year: string };
}) => {
  const { lang, sectionNumber } = params;
  const { data: edition } = await rscMustGetSurveyEditionFromUrl(params);

  const contexts = [...getCommonContexts(), ...getEditionContexts({ edition })];
  const intlContext = await rscIntlContext({ localeId: lang, contexts });

  const { socialImageUrl, year } = edition;
  const { name = "" } = edition.survey;

  const imageUrl = getSurveyImageUrl(edition);
  let imageAbsoluteUrl = socialImageUrl || imageUrl;
  const url = publicConfig.appUrl;
  const description = intlContext.formatMessage({
    id: "general.take_survey",
    values: { name, year: year + "" },
  });

  let title = getEditionTitle({ edition });

  const section =
    sectionNumber && edition.sections?.[parseInt(sectionNumber) - 1];

  if (section) {
    const { title: sectionTitleId } = getSectioni18nIds({ section });
    const sectionTitle = intlContext.formatMessage({ id: sectionTitleId });
    title += `: ${sectionTitle}`;
  }

  const meta: Metadata = {
    title,
    description,
    // NOTE: merge between route segments is shallow, you may need to repeat field from layout
    openGraph: {
      // @ts-ignore
      type: "article" as const,
      url,
      images: imageAbsoluteUrl,
    },
    twitter: {
      // @ts-ignore
      card: "summary" as const,
      images: imageAbsoluteUrl,
    },
    alternates: {
      canonical: url,
      // we could create alternates for languages too
    },
  };

  return meta;
};
