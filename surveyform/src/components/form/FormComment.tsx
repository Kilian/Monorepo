"use client";
import { useRef, useState } from "react";
import FormControl from "react-bootstrap/FormControl";
import Overlay from "react-bootstrap/Overlay";
import Tooltip from "react-bootstrap/Tooltip";

import { FormattedMessage } from "~/components/common/FormattedMessage";
import { useFormContext } from "~/components/form/FormContext";

import { useIntlContext } from "@devographics/react-i18n";
import debounce from "lodash/debounce.js";
import IconComment from "~/components/icons/Comment";
import IconCommentDots from "~/components/icons/CommentDots";
import { FormInputProps } from "./typings";
import { getOptioni18nIds } from "@devographics/i18n";
import { read } from "fs";

export const CommentTrigger = ({
  value,
  showCommentInput = false,
  setShowCommentInput,
}) => {
  const [show, setShow] = useState(showCommentInput);

  const isActive = showCommentInput || !!value;
  const intl = useIntlContext();
  const target = useRef(null);

  return (
    <div className="comment-trigger-wrapper">
      <button
        ref={target}
        className={`comment-trigger comment-trigger-${
          isActive ? "active" : "inactive"
        }`}
        type="button"
        aria-describedby="popover-basic"
        aria-label={intl.formatMessage({ id: "experience.leave_comment" })}
        title={intl.formatMessage({ id: "experience.leave_comment" })}
        onClick={() => {
          setShowCommentInput(!showCommentInput);
        }}
        onMouseOver={() => {
          setShow(true);
        }}
        onMouseOut={() => {
          setShow(false);
        }}
      >
        {value ? <IconCommentDots /> : <IconComment />}
        <span className="visually-hidden">
          <FormattedMessage id="experience.leave_comment" />
        </span>
      </button>
      <Overlay target={target.current} show={show} placement={"right"}>
        {(props) => (
          <Tooltip id="leave_comment" {...props}>
            <FormattedMessage id="experience.leave_comment_short" />
          </Tooltip>
        )}
      </Overlay>
    </div>
  );
};

interface CommentInputProps extends FormInputProps {
  commentPath: string;
  commentValue: string;
}

export const CommentInput = (props: CommentInputProps) => {
  let response;
  const intl = useIntlContext();
  const {
    commentPath,
    commentValue,
    value: questionValue,
    question,
    readOnly,
  } = props;

  const option = question.options?.find((o) => o.id === questionValue);

  const i18n = option && getOptioni18nIds({ ...props, option });
  response = i18n && intl.formatMessage({ id: i18n.base });

  return (
    <div className="comment-input">
      <h5 className="comment-input-heading">
        <FormattedMessage id="experience.leave_comment" />
      </h5>
      <p className="comment-input-subheading">
        {response ? (
          <FormattedMessage
            id="experience.tell_us_more"
            values={{ response }}
          />
        ) : (
          <FormattedMessage id="experience.tell_us_more_no_value" />
        )}
      </p>
      <CommentTextarea
        readOnly={!!readOnly}
        value={commentValue}
        path={commentPath}
      />
    </div>
  );
};

export const CommentTextarea = ({
  readOnly,
  value,
  path,
  placeholder,
}: {
  readOnly: boolean;
  value: string;
  path: string;
  placeholder?: string;
}) => {
  const [localValue, setLocalValue] = useState(value);

  const { updateCurrentValues } = useFormContext();

  const updateCurrentValuesDebounced = debounce(updateCurrentValues, 500);

  const handleChange =
    (isDebounced = false) =>
    (event) => {
      let value = event.target.value;
      setLocalValue(value);
      const _updateCurrentValues = isDebounced
        ? updateCurrentValuesDebounced
        : updateCurrentValues;
      if (value === "") {
        // @ts-ignore
        _updateCurrentValues({ [path]: null });
      } else {
        // @ts-ignore
        _updateCurrentValues({ [path]: value });
      }
    };

  return (
    <FormControl
      as="textarea"
      onChange={handleChange(true)}
      onBlur={handleChange(false)}
      value={localValue || ""}
      disabled={readOnly}
      placeholder={placeholder}
      // ref={refFunction}
      // {...inputProperties}
    />
  );
};
