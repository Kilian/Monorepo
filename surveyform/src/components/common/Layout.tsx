import React from "react";
import Footer from "./Footer";
import Header from "./Header";
import DevographicsBanner from "./DevographicsBanner";
import { FormattedMessage } from "~/components/common/FormattedMessage";

export const Layout = ({ children }: { children: any }) => {
  return (
    <div className="wrapper" id="wrapper">
      <a href="#section-questions" className="skip">
        <FormattedMessage id="general.skip_to_content" />
      </a>
      {/* <DevographicsBanner /> */}
      <Header />
      <main className="main-contents" id="main-contents">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
