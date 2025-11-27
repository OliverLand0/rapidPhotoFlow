import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./lib/ThemeContext";
import { PhotosProvider } from "./lib/PhotosContext";
import { ToastProvider } from "./components/ui/toast";
import { Layout } from "./components/Layout";
import { UploadPage } from "./pages/UploadPage";
import { ReviewPage } from "./pages/ReviewPage";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PhotosProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<UploadPage />} />
                <Route path="review" element={<ReviewPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PhotosProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
