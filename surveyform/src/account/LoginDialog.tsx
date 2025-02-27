import { AnonymousLoginForm } from "~/account/anonymousLogin/components/AnonymousLogin";
import {
  StandaloneMagicLoginForm,
  StandaloneMagicLoginFormProps,
} from "~/account/magicLogin/components/StandaloneMagicLoginForm";
import { FormattedMessage } from "~/components/common/FormattedMessage";
import { UserDocument } from "~/account/user/typings";
import { ResponseDocument } from "@devographics/types";

export const LoginDialog = ({
  hideGuest,
  user,
  surveyId,
  editionId,
  successRedirectionPath,
  successRedirectionFunction,
  loginOptions,
}: {
  hideGuest?: boolean;
  user?: UserDocument | null;
  /**
   * Redirect after succesful auth
   */
  successRedirectionPath?: string;
  successRedirectionFunction?: (res: ResponseDocument) => string;
  loginOptions?: { data?: any; createResponse?: boolean };
} & Pick<StandaloneMagicLoginFormProps, "surveyId" | "editionId">) => {
  //const redirectedFrom = router.query?.from as string;
  return user ? (
    <div>You are already logged in.</div>
  ) : (
    <div className="survey-login-options">
      <div className="survey-login-option">
        <h4>
          <FormattedMessage id="accounts.create_account" />
        </h4>
        <div className="survey-login-option-description">
          <FormattedMessage id="accounts.create_account.description" />
        </div>
        <div className="survey-login-action">
          {/* TODO: use successRedirectionPath and put it in the magic link for proper redirects */}
          <StandaloneMagicLoginForm
            surveyId={surveyId}
            editionId={editionId}
            label={<FormattedMessage id="accounts.create_account.action" />}
            redirectTo={successRedirectionPath}
            loginOptions={loginOptions}
          />
        </div>
        <div className="survey-login-option-note">
          <FormattedMessage id="accounts.create_account.note" />
        </div>
      </div>
      {!hideGuest && (
        <div className="survey-login-option">
          <h4>
            <FormattedMessage id="accounts.continue_as_guest" />
          </h4>
          <div className="survey-login-option-description">
            <FormattedMessage id="accounts.continue_as_guest.description" />
          </div>
          <div className="survey-login-action">
            <AnonymousLoginForm
              label={
                <FormattedMessage id="accounts.continue_as_guest.action" />
              }
              successRedirectionFunction={successRedirectionFunction}
              successRedirectionPath={successRedirectionPath}
              loginOptions={loginOptions}
            />
          </div>
        </div>
      )}
    </div>
  );
};
