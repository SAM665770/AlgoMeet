import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";

const App = () => {
  return (
    <>
      <header className="h-screen ">
        <Show when="signed-out">
          <SignInButton mode="modal" className="my-4 bg-gray-400 mr-4"/>
          <SignUpButton mode="modal" />
        </Show>
        <Show when="signed-in">
          <UserButton mode="modal" />
        </Show>
      </header>
    </>
  );
};

export default App;
