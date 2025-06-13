import { initWidget } from "./widget";

initWidget(widget => {
    import("../index").then(module => {
        module.default();
    });
});
