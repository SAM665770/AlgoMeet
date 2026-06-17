import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";

const App = () => {
  return (
    <>
      <header>
        <Show when="signed-out">
          <SignInButton mode="modal"/>
          <SignUpButton mode="modal"/>
        </Show>
        <Show when="signed-in">
          <UserButton mode="modal"/>
        </Show>
      </header>
    </>
  );
};

export default App;
