"use client";
import React, { useReducer, useState } from "react";
import { EditionMetadata, SurveyMetadata } from "@devographics/types";
import { apiRoutes } from "~/lib/apiRoutes";
import { convertSurveyToMarkdown } from "~/lib/export/outlineExport";
import { Loading } from "~/components/ui/Loading";

// import { ExportOptions, ExportOptionsStr } from "~/admin/models/export";
//  import { SurveyMarkdownOutline } from "~/core/components/survey/SurveyExport";
//  import { getEditionById } from "~/modules/surveys/helpers";
// // TODO: get from top-level context as in surveyform
// import { surveys } from "~/surveys";
// import { surveysQuery } from "~/components/normalization/Normalization";
// import { useQuery } from "~/lib/graphql";
/**
 * Trigger a file download for any URL
 *
 * NOTE: if the download fails and the server returns a JSON,
 * this will show the download file as a .json because of the response application type
 * @param url
 */
const triggerDownload = (url: string, filename?: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/**
 * Useful when getting the file from a POST request or a fetch response
 *
 * However it's easier to generate a <a> tag and let it trigger the relevant GET request automatically,
 * instead of using fetch
 */
const downloadFromResponse = async (response: Response, filename: string) => {
  const blob = await response.blob();
  var url = window.URL.createObjectURL(blob);
  triggerDownload(url, filename);
};

const initialState = { loading: false, error: null, res: null, done: false };
const reducer = (state, action) => {
  switch (action.type) {
    case "start": {
      return { loading: true, error: null, done: false };
    }
    case "done": {
      return { loading: false, error: null, done: true };
    }
    case "downloadStarted": {
      return initialState;
    }
    case "error": {
      const error = action.payload;
      return { loading: false, error, res: null, done: false };
    }
    default: {
      return { loading: false, res: null, error: null, done: false };
    }
  }
};

const useMutateSurveyId = ({ surveyId, editionId }) => {
  function setSurveyId(surveyId: string) {
    const params: any = { surveyId };
    if (editionId) params.editionId = editionId;
    window.location.search = new URLSearchParams(params).toString();
  }
  function setEditionId(editionId: string) {
    const params: any = { editionId };
    if (surveyId) params.surveyId = surveyId;
    window.location.search = new URLSearchParams(params).toString();
  }
  return { setSurveyId, setEditionId };
};

export const AdminExportPage = ({
  surveys,
  edition,
  surveyId,
  editionId,
}: {
  surveys: Array<SurveyMetadata>;
  edition?: EditionMetadata;
  surveyId?: string | null;
  editionId?: string | null;
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { setSurveyId, setEditionId } = useMutateSurveyId({
    surveyId,
    editionId,
  });

  const survey = surveyId ? surveys.find((s) => s.id === surveyId) : null;
  const surveyIds = surveys.map((s) => s.id);
  const editionIds = survey ? survey.editions.map((e) => e.id) : [];

  async function triggerExport(evt: React.FormEvent<HTMLFormElement>) {
    try {
      evt.preventDefault();
      dispatch({ type: "start" });
      const editionId = evt.target["editionId"].value;
      const surveyId = evt.target["editionId"].value;
      const url = apiRoutes.dataExport.href({ surveyId, editionId });

      triggerDownload(url);
      dispatch("downloadStarted");
      /*
         Alternative code with fetch
         This is better to handle error messages, however it rely on
         loading the file client-side as a BLOB, which can cost a lot of RAM

         const response = await fetch(apiRoutes.admin.dataExport.href, {
           method: "GET",
           body: JSON.stringify(body),
           headers: {
             "Content-type": "application/json",
           },
         });

         if (!response.ok) {
           const body = await response.text();
           console.error(body);
           dispatch({
             type: "error",
             payload: new Error(body.slice(0, 500)),
           });
         } else {
           dispatch({ type: "done" });
           try {
             await downloadFromResponse(response, "export.json");
             dispatch({ type: "downloadStarted" });
           } catch (error) {
             dispatch({ type: "error", payload: error });
           }
         }*/
    } catch (error) {
      console.error(error);
      dispatch({ type: "error", payload: error });
    }
  }
  return (
    <div>
      <h1>Export</h1>
      <form onSubmit={triggerExport}>
        <label htmlFor="editionId">Edition ID</label>
        <select
          id="surveyId"
          required
          // not needed for the form, but allow to display the markdown outline
          onChange={(evt) => {
            setSurveyId(evt.target.value);
          }}
          value={surveyId || ""}
        >
          <option disabled value="">
            {" "}
            -- select an option --{" "}
          </option>
          {surveyIds.map((id) => {
            return (
              <option key={id} value={id}>
                {id}
              </option>
            );
          })}
        </select>
        {surveyId && (
          <select
            id="editionId"
            required
            // not needed for the form, but allow to display the markdown outline
            onChange={(evt) => {
              setEditionId(evt.target.value);
            }}
            value={editionId || ""}
          >
            <option disabled value="">
              {" "}
              -- select an option --{" "}
            </option>
            {editionIds.map((id) => {
              return (
                <option key={id} value={id}>
                  {id}
                </option>
              );
            })}
          </select>
        )}
        <button
          type="submit"
          aria-busy={state.loading}
          disabled={state.loading}
        >
          {!state.loading ? "Download exports zip" : "Loading..."}
        </button>
      </form>
      <p>
        NOTE: if the downloaded file is a ".json" instead of ".zip" there has
        been an error server-side.
      </p>
      {state.error && <p>Error: {state.error.message}</p>}
      {state.done && <p>Download will start shortly...</p>}
      <h2>Outline</h2>
      <p>You can share this markdown content to better describe the survey</p>
      {edition ? (
        <SurveyMarkdownOutline edition={edition} />
      ) : (
        <p>Pick a valid editionId above...</p>
      )}
    </div>
  );
};

export const SurveyMarkdownOutline = ({
  edition,
}: {
  edition: EditionMetadata;
}) => {
  const [showFieldName, setShowFieldName] = useState<boolean>(false);
  // const intl = useIntlContext();
  // TODO: filter for the current survey only, but we need a tag to do so
  //const { data, loading, error } = useEntitiesQuery();

  //if (loading) return <Loading />;
  //if (error) return <span>Could not load entities</span>;
  //if (!data) return <span>No entities found</span>;
  //const { entities } = data;

  return (
    <div className="survey-section-wrapper">
      <div>
        <label htmlFor="fieldname">Show fieldName? (for CSV/JSON export)</label>
        <input
          type="checkbox"
          id="fieldname"
          name="fieldname"
          onChange={(evt) => {
            setShowFieldName(evt.target.checked);
          }}
        />
      </div>
      <textarea
        style={{ width: 800, height: 600 }}
        readOnly={true}
        value={convertSurveyToMarkdown({
          formatMessage: (key) => key, // intl.formatMessage,
          edition,
          entities: {},
          options: {
            showFieldName,
          },
        })}
      />
    </div>
  );
};
