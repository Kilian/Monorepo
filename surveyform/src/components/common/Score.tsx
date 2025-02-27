"use client";
import React, { useState, useRef } from "react";
import { getKnowledgeScore } from "~/lib/responses/helpers";
import get from "lodash/get.js";
import CountUp from "react-countup";
import Confetti from "react-confetti";
import take from "lodash/take.js";
import { useIntlContext } from "@devographics/react-i18n";
import { FormattedMessage } from "~/components/common/FormattedMessage";
import { Button } from "~/components/ui/Button";
import { EditionMetadata } from "@devographics/types";

const Features = ({
  features,
  limit,
}: {
  features: Array<any>;
  limit: any;
}) => {
  const limitedFeatures = take(features, limit);
  return (
    <div className="score-features">
      <h4 className="score-features-heading">
        <FormattedMessage id="thanks.learn_more_about" />
      </h4>{" "}
      <div className="score-features-items">
        {limitedFeatures.map((feature, i) => (
          <FeatureItem
            key={`${feature.id}_${i}`}
            feature={feature}
            showComma={i < limit - 1}
          />
        ))}
        .
      </div>
    </div>
  );
};

const FeatureItem = ({ feature, showComma }) => {
  const { entity } = feature;
  const mdnUrl = get(entity, "mdn.url");
  const TagWrapper = mdnUrl
    ? ({ children }) => <a>{children}</a>
    : ({ children }) => <span>{children}</span>;

  return (
    <div className="score-feature">
      <TagWrapper
        className="score-feature-name"
        {...(mdnUrl && {
          href: mdnUrl,
          target: "_blank",
          rel: "norefferer",
        })}
        dangerouslySetInnerHTML={{ __html: entity.nameClean || entity.name }}
      />
      {showComma && ", "}
      {/* <p className="score-feature-summary" dangerouslySetInnerHTML={{ __html: get(entity, 'mdn.summary') }} /> */}
    </div>
  );
};
const Score = ({
  response,
  edition,
}: {
  response: any;
  edition: EditionMetadata;
}) => {
  const intl = useIntlContext();
  const containerRef = useRef<HTMLInputElement | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { known, total, score, unknownFields, rank } = getKnowledgeScore({
    response,
    edition,
  });
  const { survey, questionsUrl } = edition;
  const { name, hashtag } = survey;

  const text = intl.formatMessage({
    id: "thanks.share_score_message",
    values: {
      score,
      name,
      shareUrl: `${questionsUrl}?source=post_survey_share`,
      hashtag,
    },
  });

  // if (loading) return <Components.Loading />;
  // if (error) return <span>Could not load entities</span>;

  // TODO
  const entities: Array<any> = [];
  // only keep features which have an associated entity which itself has a URL
  const unknownFeatures = unknownFields
    .map((field) => {
      const entity = entities?.find((e) => e.id === field.id);
      return {
        field,
        entity,
        url: entity?.mdn?.url,
      };
    })
    .filter((feature) => !!feature.url);

  return (
    <div className="score">
      <div className="score-calculation">
        <div className="score-calcuation-heading">
          <FormattedMessage id="thanks.features_score" />
        </div>
        <div className="score-percent">
          <CountUp
            start={0}
            delay={0.3}
            // @ts-ignore
            duration={2}
            end={score}
            onStart={() => {
              setTimeout(() => {
                setShowConfetti(true);
              }, 1200);
            }}
          />
          %
          <div className="score-confetti" ref={containerRef}>
            {showConfetti && containerRef.current && (
              <Confetti
                width={containerRef.current.offsetWidth}
                height={containerRef.current.offsetHeight}
                recycle={false}
                numberOfPieces={80}
                initialVelocityX={5}
                initialVelocityY={20}
                confettiSource={{
                  x: containerRef.current.offsetWidth / 2 - 50,
                  y: 100,
                  w: 100,
                  h: 100,
                }}
              />
            )}
          </div>
        </div>
        <div className="score-ratio">
          <FormattedMessage
            id="thanks.score_explanation_no_ranking"
            values={{ known, total }}
          />
        </div>
        {/* <div className="score-rank">
          <FormattedMessage id={`knowledge_rank.${rank}`} />
        </div> */}
        <div className="score-share">
          <Button
            target="_blank"
            href={`https://twitter.com/intent/tweet/?text=${encodeURIComponent(
              text
            )}`}
          >
            <FormattedMessage id="thanks.share_on_twitter" />
          </Button>
        </div>
        {unknownFeatures.length > 0 && (
          <Features features={unknownFeatures} limit={10} />
        )}
      </div>
    </div>
  );
};

export default Score;
