import {
  SurveyMetadata,
  EditionMetadata,
  SectionMetadata,
  QuestionMetadata,
  ResponseDocument,
  FeaturesOptions,
} from "@devographics/types";
import { getFormPaths } from "@devographics/templates";

export const getCompletionPercentage = ({
  response,
  edition,
}: {
  response: ResponseDocument;
  edition: EditionMetadata;
}) => {
  let completedCount = 0;
  let totalCount = 0;
  edition.sections.forEach((section) => {
    section.questions &&
      section.questions.forEach((question) => {
        const ignoreQuestion =
          question.template && ignoredFieldTypes.includes(question.template);
        if (!ignoreQuestion) {
          totalCount++;
          if (questionIsCompleted({ edition, question, response })) {
            completedCount++;
          }
        }
      });
  });
  const completion = Math.round((completedCount * 100) / totalCount);
  return completion;
};

const getRank = (score) => {
  if (score < 10) {
    return "rank1";
  } else if (score < 30) {
    return "rank2";
  } else if (score < 50) {
    return "rank3";
  } else if (score < 70) {
    return "rank4";
  } else if (score < 90) {
    return "rank5";
  } else {
    return "rank6";
  }
};

export const getKnowledgeScore = ({
  response,
  edition,
}: {
  response: ResponseDocument;
  edition: EditionMetadata;
}) => {
  const featureSections = edition.sections.filter(
    (section) => section.slug === "features"
  );
  const featureQuestions = featureSections
    .map((s) => s.questions)
    // NOTE: the cast is mandatory here because typing of flat
    // is not ideal
    .flat() as Array<QuestionMetadata>;

  const getValue = (question) => {
    const formPaths = getFormPaths({ edition, question });
    return formPaths.response && response[formPaths.response];
  };
  const knownFields = featureQuestions.filter((question) => {
    const value = getValue(question);
    return value === FeaturesOptions.HEARD || value === FeaturesOptions.USED;
  });
  const unknownFields = featureQuestions.filter((question) => {
    const value = getValue(question);
    return value === FeaturesOptions.NEVER_HEARD;
  });

  const unknown = unknownFields.length;
  const known = knownFields.length;
  const total = featureQuestions.length;
  const score = Math.round((known * 100) / total);
  const rank = getRank(score);

  const result = {
    total,
    unknown,
    known,
    score,
    rank,
    knownFields,
    unknownFields,
  };
  return result;
};

/**
 * Fields that do not count in the completion percentage or knowledge score
 */
export const ignoredFieldTypes = [
  "email",
  "email2",
  "receive_notifications",
  "help",
  "others",
  "project",
  "quiz",
];

/**
 * Completion percentage of a section
 * @param section
 * @param response
 * @returns null if completion cannot be computed (no fillable question), the completion percentage
 * from 0 to 100 otherwise
 */
export const getSectionCompletionPercentage = ({
  edition,
  section,
  response,
}: {
  edition: EditionMetadata;
  section: SectionMetadata;
  response?: ResponseDocument;
}) => {
  if (!response || !section.questions) {
    return null;
  }
  // don't count text questions towards completion score
  // TODO: we may have array of fields in a question yet it doesn't seem supported
  const completableQuestions = section.questions
    .filter((q) => !q.hidden)
    .filter((question) => {
      const formPaths = getFormPaths({ edition, question });
      const fieldName = formPaths?.response!;
      // NOTE: if question has no template it's a valid one, it will use the default radiogroup input
      const isValidTemplate =
        !question.template || !ignoredFieldTypes.includes(question.template);
      const isCompletable = !!(isValidTemplate && fieldName);
      return isCompletable;
    });
  const questionsCount = completableQuestions.length;
  if (!questionsCount) return null;

  const completedQuestions = completableQuestions.filter((question) =>
    questionIsCompleted({ edition, question, response })
  );

  const completedQuestionsCount = completedQuestions.length;
  return Math.round((completedQuestionsCount / questionsCount) * 100);
};

export const answerIsNotEmpty = (answer: any) =>
  !(
    typeof answer === "undefined" ||
    answer === null ||
    answer === "" ||
    (Array.isArray(answer) && answer.length === 0)
  );

export const questionIsCompleted = ({
  edition,
  question,
  response,
}: {
  edition: EditionMetadata;
  question: QuestionMetadata;
  response: ResponseDocument;
}) => {
  const formPaths = getFormPaths({ edition, question });
  const responsePath = formPaths.response;
  const otherPath = formPaths.other;
  const answer = responsePath && response[responsePath];
  const otherAnswer = otherPath && response[otherPath];
  const isCompleted = answerIsNotEmpty(answer) || answerIsNotEmpty(otherAnswer);
  return isCompleted;
};
